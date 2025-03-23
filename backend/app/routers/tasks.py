# tasks.py
from fastapi import APIRouter, Depends, HTTPException, Path, Body
from sqlmodel import Session, select
from typing import List
from app.models.tasks_models import Task, TaskCreate, TaskUpdate
from app.models.orders_models import Order
from app.database import get_session
import uuid
import json

router = APIRouter()


@router.post("/", response_model=Task)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    # Verify that the order exists
    order = session.exec(select(Order).where(Order.order_id == task.order_id)).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")

    # Generate a unique task_id
    while True:
        unique_task_id = str(uuid.uuid4())
        # Check if the task_id already exists
        existing_task = session.exec(
            select(Task).where(Task.task_id == unique_task_id)
        ).first()
        if not existing_task:
            break  # If not found, the ID is unique, exit the loop

    # Verify that the dependencies exist
    for dependency_id in task.dependencies:
        dependency = session.exec(
            select(Task).where(Task.task_id == dependency_id)
        ).first()
        if not dependency:
            raise HTTPException(
                status_code=400, detail=f"Dependency task not found: {dependency_id}"
            )

    db_task = Task(
        order_id=task.order_id,
        name=task.name,
        status=task.status,
        task_id=unique_task_id,
        dependencies=json.dumps(task.dependencies),
    )
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


@router.patch("/{task_id}", response_model=Task)
def update_task(
    task_id: str = Path(..., description="The task_id of the task to update"),
    task_update: TaskUpdate = Body(...),
    session: Session = Depends(get_session),
):
    # Get the task
    db_task = session.exec(select(Task).where(Task.task_id == task_id)).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate dependencies exist (new dependencies if provided)
    if task_update.dependencies is not None:
        for dependency_id in task_update.dependencies:
            dependency = session.exec(
                select(Task).where(Task.task_id == dependency_id)
            ).first()
            if not dependency:
                raise HTTPException(
                    status_code=400,
                    detail=f"Dependency task not found: {dependency_id}",
                )

        # Update the task
        task_data = task_update.dict(exclude_unset=True)
        for key, value in task_data.items():
            setattr(db_task, key, value)

        db_task.dependencies = json.dumps(task_update.dependencies)

        session.add(db_task)
        session.commit()
        session.refresh(db_task)
        return db_task
    else:
        # Update the task
        task_data = task_update.dict(exclude_unset=True)
        for key, value in task_data.items():
            setattr(db_task, key, value)

        session.add(db_task)
        session.commit()
        session.refresh(db_task)
        return db_task
