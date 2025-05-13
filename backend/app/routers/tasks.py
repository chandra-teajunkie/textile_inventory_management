from fastapi import APIRouter, Depends, HTTPException, Path, Body, File, UploadFile
from sqlmodel import Session, select
from typing import List
from app.models.tasks_models import Task, TaskCreate, TaskUpdate, TaskStatus
from app.models.orders_models import Order
from app.database.database import get_session
from app.utils.utils import generate_unique_id, process_size_chart
import json

router = APIRouter()


def process_dependencies(task_update: TaskUpdate, session: Session):
    """Validate that dependencies exist in the task update."""
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


@router.post("/", response_model=Task)
def create_task(task: TaskCreate, session: Session = Depends(get_session)):
    # Verify that the order exists
    order = session.exec(select(Order).where(Order.order_id == task.order_id)).first()
    if not order:
        raise HTTPException(status_code=400, detail="Order not found")

    # Generate a unique task_id using the utility function
    unique_task_id = generate_unique_id(Task, session, "task_id")

    # If task has no dependencies, assign the order's size chart as the incoming chart
    if not task.dependencies:
        incoming_chart = order.size_chart  # Use the size chart from the order
    else:
        # Use the process_dependencies function to validate the dependencies
        process_dependencies(task, session)

        # If there are dependencies, check their outgoing charts and assign them as incoming chart
        for dep_id in task.dependencies:
            dep_task = session.exec(select(Task).where(Task.task_id == dep_id)).first()
            if dep_task:
                if (
                    dep_task.outgoing_chart
                ):  # If the dependency has an outgoing chart, use it
                    incoming_chart = dep_task.outgoing_chart
                else:
                    incoming_chart = (
                        None  # No outgoing chart, set incoming chart to None
                    )

    # Create the task using unpacking for task_create fields
    db_task = Task(
        task_id=unique_task_id,
        dependencies=json.dumps(task.dependencies) if task.dependencies else None,
        incoming_chart=incoming_chart,  # Set the determined incoming chart
        outgoing_chart=None,  # Outgoing chart will be updated later, so set to None initially
        **task.model_dump(
            exclude={"dependencies", "incoming_chart", "outgoing_chart"}
        ),  # Unpack other fields
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

    # Track if status was updated
    status_updated = "status" in task_update.model_dump(exclude_unset=True)

    # Validate dependencies exist
    process_dependencies(task_update, session)

    # Apply updates using ** to unpack fields
    task_data = task_update.model_dump(exclude_unset=True)  # Only fields that are set
    for key, value in task_data.items():
        setattr(db_task, key, value)

    if task_update.dependencies is not None:
        db_task.dependencies = json.dumps(task_update.dependencies)

    session.add(db_task)
    session.commit()
    session.refresh(db_task)

    # If status was updated, update dependencies in the same order
    if status_updated:
        tasks_in_order = session.exec(
            select(Task).where(Task.order_id == db_task.order_id)
        ).all()

        for task in tasks_in_order:
            if task.dependencies:
                dependency_ids = json.loads(task.dependencies)
                dependent_tasks = session.exec(
                    select(Task).where(Task.task_id.in_(dependency_ids))
                ).all()

                # Check if all dependencies are COMPLETED
                if all(dep.status == TaskStatus.COMPLETED for dep in dependent_tasks):
                    if task.status == TaskStatus.BLOCKED:
                        task.status = TaskStatus.NOT_STARTED
                else:
                    task.status = TaskStatus.BLOCKED

                session.add(task)

        session.commit()

    return db_task


@router.patch("/outgoing-chart-upload/{task_id}", response_model=Task)
async def upload_task_outgoing_chart(
    task_id: str,
    outgoing_chart_file: UploadFile = File(
        ..., description="CSV file containing outgoing chart"
    ),
    session: Session = Depends(get_session),
):
    # Get the task
    db_task = session.exec(select(Task).where(Task.task_id == task_id)).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    outgoing_chart_json = await process_size_chart(outgoing_chart_file)

    # Save to outgoing_chart
    db_task.outgoing_chart = outgoing_chart_json
    session.add(db_task)
    session.commit()
    session.refresh(db_task)

    # Propagate to dependent tasks within the same order
    dependent_tasks = session.exec(
        select(Task).where(Task.order_id == db_task.order_id)
    ).all()

    for task in dependent_tasks:
        if task.dependencies:
            dependency_ids = json.loads(task.dependencies)
            if task_id in dependency_ids:
                task.incoming_chart = outgoing_chart_json
                session.add(task)

        session.commit()

    return db_task


@router.patch("/incoming-chart-upload/{task_id}", response_model=Task)
async def upload_task_incoming_chart(
    task_id: str,
    incoming_chart_file: UploadFile = File(
        ..., description="CSV file containing incoming chart"
    ),
    session: Session = Depends(get_session),
):
    # Get the task
    db_task = session.exec(select(Task).where(Task.task_id == task_id)).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Process the incoming chart file
    incoming_chart_json = await process_size_chart(incoming_chart_file)

    # Save the incoming chart to the task
    db_task.incoming_chart = incoming_chart_json
    session.add(db_task)
    session.commit()

    return db_task


@router.delete("/{task_id}", response_model=Task)
def delete_task(task_id: str, session: Session = Depends(get_session)):
    # Check if the task exists
    task = session.exec(select(Task).where(Task.task_id == task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete the task
    session.delete(task)
    session.commit()

    return task  # Returning the deleted task details
