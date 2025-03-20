from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.models import Task, TaskCreate, Order, TaskTemplate
from app.database import get_session

router = APIRouter()


@router.post("/", response_model=Task)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    # Verify that the order exists
    order = session.get(Order, task.order_id)
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")

    # Verify that the task template exists
    task_template = session.get(TaskTemplate, task.task_template_id)
    if not task_template:
        raise HTTPException(status_code=400, detail="Task Template not found")

    db_task = Task(**task.model_dump())
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task
