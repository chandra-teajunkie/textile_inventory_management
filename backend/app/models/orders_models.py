from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, UniqueConstraint
from datetime import datetime
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.purchase_orders_models import (
        PurchaseOrder,
    )  # Import PurchaseOrder model


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: str = Field(index=True, unique=True)
    number_of_overall_pieces: int
    types: str
    colors: str
    customer_name: str
    order_date: datetime
    start_date: datetime
    due_date: datetime
    special_notes: Optional[str] = None
    purchase_orders: List["PurchaseOrder"] = Relationship(
        back_populates="order"
    )  # Relationship to PurchaseOrder
    size_chart: Optional[str] = Field(default=None)  # JSON string for size chart


class OrderCreate(SQLModel):
    number_of_overall_pieces: int
    types: str
    colors: str
    customer_name: str
    order_date: datetime
    start_date: datetime
    due_date: datetime
    special_notes: Optional[str] = None


class OrderUpdate(SQLModel):
    number_of_overall_pieces: Optional[int] = None
    types: Optional[str] = None
    colors: Optional[str] = None
    customer_name: Optional[str] = None
    order_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    special_notes: Optional[str] = None
    size_chart: Optional[str] = Field(default=None)


class OrderMetadata(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    category: str  # e.g., 'color', 'type', 'product'
    value: str  # e.g., 'Red', 'Pant', etc.

    __table_args__ = (UniqueConstraint("category", "value"),)
