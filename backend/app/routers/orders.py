from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlmodel import Session, select
from typing import Optional, List
from app.models.orders_models import Order, OrderCreate, OrderUpdate, OrderMetadata
from app.models.purchase_orders_models import PurchaseOrder
from app.database.database import get_session
from app.utils.utils import (
    generate_unique_id,
    process_size_chart,
    update_order_metadata_if_new,
    initialize_purchase_unit_notes,
)
import json
import pandas as pd
from collections import defaultdict

router = APIRouter()


@router.post("/", response_model=Order)
async def create_order(
    order: str = Form(...),  # Accept as a string
    size_chart_file: Optional[UploadFile] = File(None),
    size_chart_json: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    # Convert string JSON data to dictionary
    order_data = json.loads(order)
    order_create = OrderCreate(**order_data)
    # Generate a unique order_id
    unique_order_id = generate_unique_id(Order, session, "order_id")

    # Normalize notes (ensures all PurchaseOrderUnit keys exist)
    normalized_notes = initialize_purchase_unit_notes(
        order_data.get("purchase_unit_notes")
    )

    metadata_fields = ["types", "colors", "customer_name"]

    for field_name in metadata_fields:
        raw_value = order_data.get(field_name)
        if raw_value:
            # If comma-separated (e.g., "Red, Blue"), split into individual values
            values = (
                [v.strip().lower() for v in raw_value.split(",")]
                if isinstance(raw_value, str)
                else [raw_value]
            )
            for val in values:
                if val:  # Avoid empty strings
                    update_order_metadata_if_new(field_name, val, session)

    # Process chart:
    size_chart_data = None

    if size_chart_file:
        size_chart_data = await process_size_chart(size_chart_file)
    elif size_chart_json:
        try:
            # Validate JSON is parseable to a DataFrame
            pd.read_json(size_chart_json)  # validation step
            size_chart_data = size_chart_json
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid size_chart_json: {e}")

    # Create the Order using unpacking for order_create fields
    db_order = Order(
        order_id=unique_order_id,  # Assign the generated ID
        size_chart=size_chart_data,  # Store the processed size chart data
        purchase_unit_notes=normalized_notes,  # Store normalized notes
        **order_create.model_dump(),  # Unpacks all fields from OrderCreate model
    )

    session.add(db_order)
    session.commit()
    session.refresh(db_order)

    return db_order


@router.get("/", response_model=List[Order])
def get_all_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order)).all()
    return orders


@router.patch("/{order_id}", response_model=Order)
async def update_order(
    order_id: str,
    order_update: str = Form(...),  # JSON data as a string
    size_chart_file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    # Retrieve the order from the database
    db_order = session.exec(select(Order).where(Order.order_id == order_id)).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Convert string JSON data to dictionary
    update_data = json.loads(order_update)

    # Convert to Pydantic model (optional validation)
    order_update_model = OrderUpdate(**update_data)

    # Normalize purchase_unit_notes if provided
    if "purchase_unit_notes" in update_data:
        normalized_notes = initialize_purchase_unit_notes(
            update_data["purchase_unit_notes"]
        )
        db_order.purchase_unit_notes = normalized_notes

    # Apply updates dynamically using ** to unpack fields
    update_fields = order_update_model.dict(
        exclude_unset=True
    )  # Only fields that are set
    for key, value in update_fields.items():
        setattr(db_order, key, value)

    # Handle the file upload for size_chart
    if size_chart_file:
        # Process the uploaded file
        size_chart_data = await process_size_chart(size_chart_file)
        db_order.size_chart = size_chart_data  # Update size_chart with new data

    session.add(db_order)
    session.commit()
    session.refresh(db_order)

    return db_order


@router.delete("/{order_id}", response_model=Order)
def delete_order(order_id: str, session: Session = Depends(get_session)):
    # Check if the order exists
    order = session.exec(select(Order).where(Order.order_id == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Find all purchase_orders associated with the order
    purchase_orders = session.exec(
        select(PurchaseOrder).where(PurchaseOrder.order_id == order_id)
    ).all()

    # Delete all purchase_orders associated with this order
    for purchase_order in purchase_orders:
        session.delete(purchase_order)

    # Delete the order
    session.delete(order)
    session.commit()

    return order  # Returning the deleted order details


@router.get("/metadata", response_model=dict)
def get_all_metadata(session: Session = Depends(get_session)):
    results = session.exec(select(OrderMetadata)).all()

    metadata = defaultdict(list)
    for item in results:
        metadata[item.category].append(item.value)

    # Optionally, remove duplicates (if any)
    metadata = {k: sorted(set(v)) for k, v in metadata.items()}

    return metadata


@router.get("/order-details/{order_id}", response_model=Order)
def get_order_details(order_id: str, session: Session = Depends(get_session)):
    order = session.exec(select(Order).where(Order.order_id == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
