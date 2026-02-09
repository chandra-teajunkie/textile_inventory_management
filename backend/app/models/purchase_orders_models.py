from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, UniqueConstraint
from datetime import datetime
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.tasks_models import (
        Task,
    )  # Import Task model


class PurchaseOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    purchase_order_id: str = Field(index=True, unique=True)
    number_of_overall_pieces: int
    types: str
    colors: str
    customer_name: str
    purchase_order_date: datetime
    start_date: datetime
    due_date: datetime
    special_notes: Optional[str] = None
    tasks: List["Task"] = Relationship(
        back_populates="purchase_order"
    )  # Relationship to Task
    size_chart: Optional[str] = Field(default=None)  # JSON string for size chart
    task_unit_notes: Optional[str] = Field(default="{}")  # JSON string of notes


class PurchaseOrderCreate(SQLModel):
    number_of_overall_pieces: int
    types: str
    colors: str
    customer_name: str
    purchase_order_date: datetime
    start_date: datetime
    due_date: datetime
    special_notes: Optional[str] = None
    task_unit_notes: Optional[dict] = None


class PurchaseOrderUpdate(SQLModel):
    number_of_overall_pieces: Optional[int] = None
    types: Optional[str] = None
    colors: Optional[str] = None
    customer_name: Optional[str] = None
    purchase_order_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    special_notes: Optional[str] = None
    size_chart: Optional[str] = Field(default=None)
    task_unit_notes: Optional[dict] = None
    propagate_to_all_incoming_charts: Optional[bool] = None


class PurchaseOrderMetadata(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    category: str  # e.g., 'color', 'type', 'product'
    value: str  # e.g., 'Red', 'Pant', etc.

    __table_args__ = (UniqueConstraint("category", "value"),)
