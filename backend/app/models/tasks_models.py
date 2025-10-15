# tasks_models.py
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.purchase_orders_models import PurchaseOrder


class TaskStatus(str, Enum):
    NOT_STARTED = "NOT STARTED"
    IN_PROGRESS = "IN PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"


class TaskUnit(str, Enum):
    PROCUREMENT = "PROCUREMENT"
    CUTTING = "CUTTING"
    COLLAR = "COLLAR"
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
    purchase_order_id: str = Field(foreign_key="purchaseorder.purchase_order_id")
    purchase_order: "PurchaseOrder" = Relationship(back_populates="tasks")
    name: str
    product: str
    color: str
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)
    task_unit: TaskUnit = Field(default=TaskUnit.UNASSIGNED)
    task_unit_name: Optional[str] = None
    dependencies: Optional[str] = Field(default="[]")  # JSON list of task_ids
    incoming_chart: Optional[str] = Field(
        default=None
    )  # JSON string of size chart data
    outgoing_chart: Optional[str] = Field(
        default=None
    )  # JSON string of updated size chart data
    special_notes: Optional[str] = Field(
        default=None, description="Notes specific to this task"
    )
    incoming_chart_notes: Optional[str] = Field(default=None)
    outgoing_chart_notes: Optional[str] = Field(default=None)


class TaskCreate(SQLModel):
    purchase_order_id: str
    name: str
    product: str
    color: str
    task_unit: TaskUnit = Field(default=TaskUnit.UNASSIGNED)
    task_unit_name: Optional[str] = None
    status: TaskStatus = Field(default=TaskStatus.NOT_STARTED)
    dependencies: List[str] = []  # List of task_ids
    special_notes: Optional[str] = None
    incoming_chart_notes: Optional[str] = None
    outgoing_chart_notes: Optional[str] = None


class TaskUpdate(SQLModel):
    name: Optional[str] = None
    product: Optional[str] = None
    color: Optional[str] = None
    task_unit: Optional[TaskUnit] = None
    task_unit_name: Optional[str] = None
    status: Optional[TaskStatus] = None
    dependencies: Optional[List[str]] = []  # List of task_ids
    special_notes: Optional[str] = None
    incoming_chart_notes: Optional[str] = None
    outgoing_chart_notes: Optional[str] = None
