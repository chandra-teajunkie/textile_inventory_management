# tasks_models.py
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.orders_models import Order


class TaskStatus(str, Enum):
    NOT_STARTED = "NOT STARTED"
    IN_PROGRESS = "IN PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: str = Field(
        index=True, unique=True, default_factory=lambda: str(uuid.uuid4())
    )
    order_id: str = Field(foreign_key="order.order_id")
    order: "Order" = Relationship(back_populates="tasks")
    name: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)
    dependencies: Optional[str] = Field(default="[]")  # JSON list of task_ids


class TaskCreate(SQLModel):
    order_id: str
    name: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)
    dependencies: List[str] = []  # List of task_ids


class TaskUpdate(SQLModel):
    status: Optional[TaskStatus] = None
    dependencies: Optional[List[str]] = []  # List of task_ids
