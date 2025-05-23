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


class TaskUnit(str, Enum):
    CUTTING = "CUTTING"
    PRINTING = "PRINTING"
    EMBROIDERY = "EMBROIDERY"
    STITCHING = "STITCHING"
    PACKAGING = "PACKAGING"
    UNASSIGNED = "UNASSIGNED"


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: str = Field(
        index=True, unique=True, default_factory=lambda: str(uuid.uuid4())
    )
    order_id: str = Field(foreign_key="order.order_id")
    order: "Order" = Relationship(back_populates="tasks")
    name: str
    product: str
    color: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)
    task_unit: TaskUnit = Field(default=TaskUnit.UNASSIGNED)
    dependencies: Optional[str] = Field(default="[]")  # JSON list of task_ids
    incoming_chart: Optional[str] = Field(
        default=None
    )  # JSON string of size chart data
    outgoing_chart: Optional[str] = Field(
        default=None
    )  # JSON string of updated size chart data


class TaskCreate(SQLModel):
    order_id: str
    name: str
    product: str
    color: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)
    task_unit: TaskUnit = Field(default=TaskUnit.UNASSIGNED)
    dependencies: List[str] = []  # List of task_ids


class TaskUpdate(SQLModel):
    name: Optional[str] = None
    product: Optional[str] = None
    color: Optional[str] = None
    status: Optional[TaskStatus] = None
    task_unit: Optional[TaskUnit] = None
    dependencies: Optional[List[str]] = []  # List of task_ids
