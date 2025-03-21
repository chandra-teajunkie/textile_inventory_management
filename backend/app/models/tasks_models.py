# app/models/task_models.py
from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from app.models.orders_models import Order  # Import Order model


class TaskStatus(str, Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "BLOCKED"


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: str = Field(foreign_key="order.order_id")
    order: "Order" = Relationship(back_populates="tasks")
    name: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)


class TaskCreate(SQLModel):
    order_id: str
    name: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)


class TaskUpdate(SQLModel):
    status: Optional[TaskStatus] = None
