from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.models.tasks_models import Task, TaskCreate
from app.models.orders_models import Order
from app.database import get_session
from typing import List

router = APIRouter()


@router.post("/", response_model=Task)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    # Verify that the order exists
    order = session.exec(select(Order).where(Order.order_id == task.order_id)).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")

    db_task = Task(order_id=order.order_id, name=task.name, status=task.status)
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


@router.get("/", response_model=List[Task])
def get_tasks_for_order(order_id: str, session: Session = Depends(get_session)):
    order = session.exec(select(Order).where(Order.order_id == order_id)).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")
    tasks = session.exec(select(Task).where(Task.order_id == order.order_id)).all()
    return tasks
