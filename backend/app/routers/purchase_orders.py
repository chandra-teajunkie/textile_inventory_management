from fastapi import APIRouter, Depends, HTTPException, Path, Body, Form
from sqlmodel import Session, select
from typing import List
from app.models.purchase_orders_models import (
    PurchaseOrder,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderStatus,
)
from app.models.orders_models import Order
from app.database.database import get_session
from app.utils.utils import generate_unique_id
import json
from fastapi.responses import StreamingResponse
import pandas as pd
from io import StringIO

router = APIRouter()


def process_dependencies(purchase_order_update: PurchaseOrderUpdate, session: Session):
    """Validate that dependencies exist in the purchase_order update."""
    if purchase_order_update.dependencies:
        for dependency_id in purchase_order_update.dependencies:
            if not dependency_id:  # Skips "", None, etc.
                continue
            dependency = session.exec(
                select(PurchaseOrder).where(
                    PurchaseOrder.purchase_order_id == dependency_id
                )
            ).first()
            if not dependency:
                raise HTTPException(
                    status_code=400,
                    detail=f"Dependency purchase_order not found: {dependency_id}",
                )


@router.post("/", response_model=PurchaseOrder)
def create_purchase_order(
    purchase_order: PurchaseOrderCreate, session: Session = Depends(get_session)
):
    if not purchase_order.dependencies or all(
        not d for d in purchase_order.dependencies
    ):
        purchase_order.dependencies = None

    # Verify that the order exists
    order = session.exec(
        select(Order).where(Order.order_id == purchase_order.order_id)
    ).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")

    # Generate a unique purchase_order_id using the utility function
    unique_purchase_order_id = generate_unique_id(
        PurchaseOrder, session, "purchase_order_id"
    )

    # If purchase_order has no dependencies, assign the order's size chart as the incoming chart
    if not purchase_order.dependencies:
        incoming_chart = order.size_chart  # Use the size chart from the order
    else:
        # Use the process_dependencies function to validate the dependencies
        process_dependencies(purchase_order, session)

        # If there are dependencies, check their outgoing charts and assign them as incoming chart
        for dep_id in purchase_order.dependencies:
            dep_purchase_order = session.exec(
                select(PurchaseOrder).where(PurchaseOrder.purchase_order_id == dep_id)
            ).first()
            if dep_purchase_order:
                if (
                    dep_purchase_order.outgoing_chart
                ):  # If the dependency has an outgoing chart, use it
                    incoming_chart = dep_purchase_order.outgoing_chart
                else:
                    incoming_chart = (
                        None  # No outgoing chart, set incoming chart to None
                    )

    # Create the purchase_order using unpacking for purchase_order_create fields
    db_purchase_order = PurchaseOrder(
        purchase_order_id=unique_purchase_order_id,
        dependencies=json.dumps(purchase_order.dependencies)
        if purchase_order.dependencies
        else None,
        incoming_chart=incoming_chart,  # Set the determined incoming chart
        outgoing_chart=None,  # Outgoing chart will be updated later, so set to None initially
        **purchase_order.model_dump(
            exclude={"dependencies", "incoming_chart", "outgoing_chart"}
        ),  # Unpack other fields
    )

    session.add(db_purchase_order)
    session.commit()
    session.refresh(db_purchase_order)
    return db_purchase_order


@router.get("/", response_model=List[PurchaseOrder])
def get_purchase_orders_for_order(
    order_id: str, session: Session = Depends(get_session)
):
    order = session.exec(select(Order).where(Order.order_id == order_id)).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")
    purchase_orders = session.exec(
        select(PurchaseOrder).where(PurchaseOrder.order_id == order.order_id)
    ).all()
    return purchase_orders


@router.get("/purchase-order-details/{purchase_order_id}")
def get_purchase_order_details(
    purchase_order_id: str, session: Session = Depends(get_session)
):
    purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()

    if not purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    return {
        "purchase_order_id": purchase_order.purchase_order_id,
        "order_id": purchase_order.order_id,
        "name": purchase_order.name,
        "product": purchase_order.product,
        "color": purchase_order.color,
        "status": purchase_order.status,
        "purchase_order_unit": purchase_order.purchase_order_unit,
        "dependencies": purchase_order.dependencies,
        "incoming_chart": purchase_order.incoming_chart,
        "outgoing_chart": purchase_order.outgoing_chart,
    }


@router.patch("/{purchase_order_id}", response_model=PurchaseOrder)
def update_purchase_order(
    purchase_order_id: str = Path(
        ..., description="The purchase_order_id of the purchase_order to update"
    ),
    purchase_order_update: PurchaseOrderUpdate = Body(...),
    session: Session = Depends(get_session),
):
    # Get the purchase_order
    db_purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    # Track if status was updated
    status_updated = "status" in purchase_order_update.model_dump(exclude_unset=True)

    # Validate dependencies exist
    process_dependencies(purchase_order_update, session)

    # Apply updates using ** to unpack fields
    purchase_order_data = purchase_order_update.model_dump(
        exclude_unset=True
    )  # Only fields that are set
    for key, value in purchase_order_data.items():
        setattr(db_purchase_order, key, value)

    if purchase_order_update.dependencies is not None:
        db_purchase_order.dependencies = json.dumps(purchase_order_update.dependencies)

    session.add(db_purchase_order)
    session.commit()
    session.refresh(db_purchase_order)

    # If status was updated, update dependencies in the same order
    if status_updated:
        purchase_orders_in_order = session.exec(
            select(PurchaseOrder).where(
                PurchaseOrder.order_id == db_purchase_order.order_id
            )
        ).all()

        for purchase_order in purchase_orders_in_order:
            if purchase_order.dependencies:
                dependency_ids = json.loads(purchase_order.dependencies)
                dependent_purchase_orders = session.exec(
                    select(PurchaseOrder).where(
                        PurchaseOrder.purchase_order_id.in_(dependency_ids)
                    )
                ).all()

                # Check if all dependencies are COMPLETED
                if all(
                    dep.status == PurchaseOrderStatus.COMPLETED
                    for dep in dependent_purchase_orders
                ):
                    if purchase_order.status == PurchaseOrderStatus.BLOCKED:
                        purchase_order.status = PurchaseOrderStatus.NOT_STARTED
                else:
                    purchase_order.status = PurchaseOrderStatus.BLOCKED

                session.add(purchase_order)

        session.commit()

    return db_purchase_order


@router.patch(
    "/outgoing-chart-upload/{purchase_order_id}", response_model=PurchaseOrder
)
async def upload_purchase_order_outgoing_chart(
    purchase_order_id: str,
    outgoing_chart_json: str = Form(
        ..., description="JSON string containing outgoing chart"
    ),
    session: Session = Depends(get_session),
):
    # Get the purchase_order
    db_purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    # Save to outgoing_chart
    db_purchase_order.outgoing_chart = outgoing_chart_json
    session.add(db_purchase_order)
    session.commit()
    session.refresh(db_purchase_order)

    # Propagate to dependent purchase_orders within the same order
    dependent_purchase_orders = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.order_id == db_purchase_order.order_id
        )
    ).all()

    for purchase_order in dependent_purchase_orders:
        if purchase_order.dependencies:
            dependency_ids = json.loads(purchase_order.dependencies)
            if purchase_order_id in dependency_ids:
                purchase_order.incoming_chart = outgoing_chart_json
                session.add(purchase_order)

        session.commit()

    return db_purchase_order


@router.patch(
    "/incoming-chart-upload/{purchase_order_id}", response_model=PurchaseOrder
)
async def upload_purchase_order_incoming_chart(
    purchase_order_id: str,
    incoming_chart_json: str = Form(
        ..., description="JSON string containing incoming chart"
    ),
    session: Session = Depends(get_session),
):
    # Get the purchase_order
    db_purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    # Save the incoming chart to the purchase_order
    db_purchase_order.incoming_chart = incoming_chart_json
    session.add(db_purchase_order)
    session.commit()

    return db_purchase_order


@router.delete("/{purchase_order_id}", response_model=PurchaseOrder)
def delete_purchase_order(
    purchase_order_id: str, session: Session = Depends(get_session)
):
    # Check if the purchase_order exists
    purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()
    if not purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    # Delete the purchase_order
    session.delete(purchase_order)
    session.commit()

    return purchase_order  # Returning the deleted purchase_order details


@router.get("/download-chart/{purchase_order_id}", response_class=StreamingResponse)
async def download_purchase_order_chart(
    purchase_order_id: str,
    chart_type: str = "incoming",  # Default is "incoming", can be "outgoing" as well
    session: Session = Depends(get_session),
):
    # Get the purchase_order
    db_purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    # Determine which chart to download
    if chart_type == "incoming":
        chart_data = db_purchase_order.incoming_chart
    elif chart_type == "outgoing":
        chart_data = db_purchase_order.outgoing_chart
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid chart type. Choose 'incoming' or 'outgoing'.",
        )

    if not chart_data:
        raise HTTPException(
            status_code=404,
            detail=f"{chart_type.capitalize()} chart not found for the purchase_order.",
        )

    # Convert the JSON chart data back to a DataFrame
    try:
        chart_json = json.loads(chart_data)
        chart_df = pd.DataFrame.from_dict(chart_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chart data: {e}")

    # Convert the DataFrame to CSV format
    csv_buffer = StringIO()
    chart_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    # Return the CSV as a downloadable file
    return StreamingResponse(
        csv_buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=purchase_order_{purchase_order_id}_{chart_type}_chart.csv"
        },
    )
