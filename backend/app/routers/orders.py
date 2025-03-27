from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlmodel import Session, select
import uuid  # Import the uuid module
import pandas as pd
from io import StringIO  # Import StringIO
from typing import Optional, List
from app.models.orders_models import Order, OrderCreate
from app.models.tasks_models import Task
from app.database import get_session
import json

router = APIRouter()


@router.post("/", response_model=Order)
async def create_order(
    order: str = Form(...),  # Accept as a string
    size_chart_file: Optional[UploadFile] = File(None),
    session: Session = Depends(get_session),
):
    order_data = json.loads(order)  # Convert string to dictionary
    order = OrderCreate(**order_data)  # Convert to Pydantic model

    # Generate a unique order_id
    while True:
        unique_order_id = str(uuid.uuid4())
        # Check if the order_id already exists
        existing_order = session.exec(
            select(Order).where(Order.order_id == unique_order_id)
        ).first()
        if not existing_order:
            break  # If not found, the ID is unique, exit the loop

    # Handle the file upload
    size_chart_data = None
    if size_chart_file:
        try:
            contents = await size_chart_file.read()
            decoded_contents = contents.decode("utf-8")  # Assuming UTF-8 encoding
            df = pd.read_csv(StringIO(decoded_contents))
            # Convert DataFrame to JSON string
            size_chart_data = df.to_json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing file: {e}")

    # Create the Order
    db_order = Order(
        order_id=unique_order_id,  # Assign the generated ID
        number_of_overall_pieces=order.number_of_overall_pieces,
        types=order.types,
        colors=order.colors,
        design_specs=order.design_specs,
        customer_id=order.customer_id,
        order_date=order.order_date,
        start_date=order.start_date,
        due_date=order.due_date,
        special_notes=order.special_notes,
        size_chart=size_chart_data,  # Store the dataframe as JSON
    )
    session.add(db_order)
    session.commit()
    session.refresh(db_order)

    return db_order


@router.get("/", response_model=List[Order])
def read_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order)).all()
    return orders


@router.delete("/{order_id}", response_model=Order)
def delete_order(order_id: str, session: Session = Depends(get_session)):
    # Check if the order exists
    order = session.exec(select(Order).where(Order.order_id == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Find all tasks associated with the order
    tasks = session.exec(select(Task).where(Task.order_id == order_id)).all()

    # Delete all tasks associated with this order
    for task in tasks:
        session.delete(task)

    # Delete the order
    session.delete(order)
    session.commit()

    return order  # Returning the deleted order details
