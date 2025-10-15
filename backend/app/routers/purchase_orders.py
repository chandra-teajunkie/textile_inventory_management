from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlmodel import Session, select
from typing import Optional, List
from app.models.purchase_orders_models import (
    PurchaseOrder,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderMetadata,
)
from app.models.tasks_models import Task
from app.database.database import get_session
from app.utils.utils import (
    generate_unique_id,
    process_size_chart,
    update_purchase_order_metadata_if_new,
    initialize_task_unit_notes,
)
import json
import pandas as pd
from collections import defaultdict

router = APIRouter()


@router.post("/", response_model=PurchaseOrder)
async def create_purchase_order(
    purchase_order: str = Form(...),  # Accept as a string
    size_chart_file: Optional[UploadFile] = File(None),
    size_chart_json: Optional[str] = Form(None),
    session: Session = Depends(get_session),
):
    # Convert string JSON data to dictionary
    purchase_order_data = json.loads(purchase_order)
    purchase_order_create = PurchaseOrderCreate(**purchase_order_data)
    # Generate a unique purchase_order_id
    unique_purchase_order_id = generate_unique_id(
        PurchaseOrder, session, "purchase_order_id"
    )

    # Normalize notes (ensures all TaskUnit keys exist)
    normalized_notes = initialize_task_unit_notes(
        purchase_order_data.get("task_unit_notes")
    )

    metadata_fields = ["types", "colors", "customer_name"]

    for field_name in metadata_fields:
        raw_value = purchase_order_data.get(field_name)
        if raw_value:
            # If comma-separated (e.g., "Red, Blue"), split into individual values
            values = (
                [v.strip().lower() for v in raw_value.split(",")]
                if isinstance(raw_value, str)
                else [raw_value]
            )
            for val in values:
                if val:  # Avoid empty strings
                    update_purchase_order_metadata_if_new(field_name, val, session)

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

    # Create the PurchaseOrder using unpacking for purchase_order_create fields
    db_purchase_order = PurchaseOrder(
        purchase_order_id=unique_purchase_order_id,  # Assign the generated ID
        size_chart=size_chart_data,  # Store the processed size chart data
        task_unit_notes=normalized_notes,  # Store normalized notes
        **purchase_order_create.model_dump(exclude={"task_unit_notes"}),
    )

    session.add(db_purchase_order)
    session.commit()
    session.refresh(db_purchase_order)

    return db_purchase_order


@router.get("/", response_model=List[PurchaseOrder])
def get_all_purchase_orders(session: Session = Depends(get_session)):
    purchase_orders = session.exec(select(PurchaseOrder)).all()
    return purchase_orders


@router.patch("/{purchase_order_id}", response_model=PurchaseOrder)
async def update_purchase_order(
    purchase_order_id: str,
    purchase_order_update: str = Form(...),  # JSON data as a string
    size_chart_file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    # Retrieve the purchase_order from the database
    db_purchase_order = session.exec(
        select(PurchaseOrder).where(
            PurchaseOrder.purchase_order_id == purchase_order_id
        )
    ).first()
    if not db_purchase_order:
        raise HTTPException(status_code=404, detail="PurchaseOrder not found")

    # Convert string JSON data to dictionary
    update_data = json.loads(purchase_order_update)

    # Convert to Pydantic model (optional validation)
    purchase_order_update_model = PurchaseOrderUpdate(**update_data)

    # Apply updates dynamically using ** to unpack fields, excluding task_unit_notes
    update_fields = purchase_order_update_model.dict(
        exclude_unset=True, exclude={"task_unit_notes"}
    )
    for key, value in update_fields.items():
        setattr(db_purchase_order, key, value)

    # Normalize and assign task_unit_notes if provided
    if "task_unit_notes" in update_data:
        normalized_notes = initialize_task_unit_notes(update_data["task_unit_notes"])
        db_purchase_order.task_unit_notes = (
            normalized_notes  # This is a dict, safe for JSON column
        )

    # Handle the file upload for size_chart
    if size_chart_file:
        # Process the uploaded file
        size_chart_data = await process_size_chart(size_chart_file)
        db_purchase_order.size_chart = (
            size_chart_data  # Update size_chart with new data
        )

    session.add(db_purchase_order)
    session.commit()
    session.refresh(db_purchase_order)

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

    # Find all tasks associated with the purchase_order
    tasks = session.exec(
        select(Task).where(Task.purchase_order_id == purchase_order_id)
    ).all()

    # Delete all tasks associated with this purchase_order
    for task in tasks:
        session.delete(task)

    # Delete the purchase_order
    session.delete(purchase_order)
    session.commit()

    return purchase_order  # Returning the deleted purchase_order details


@router.get("/metadata", response_model=dict)
def get_all_metadata(session: Session = Depends(get_session)):
    results = session.exec(select(PurchaseOrderMetadata)).all()

    metadata = defaultdict(list)
    for item in results:
        metadata[item.category].append(item.value)

    # Optionally, remove duplicates (if any)
    metadata = {k: sorted(set(v)) for k, v in metadata.items()}

    return metadata


@router.get("/purchase-order-details/{purchase_order_id}", response_model=PurchaseOrder)
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
    return purchase_order
