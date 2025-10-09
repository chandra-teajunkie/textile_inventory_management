# purchase_orders_models.py
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from enum import Enum
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from app.models.orders_models import Order


class PurchaseOrderStatus(str, Enum):
    NOT_STARTED = "NOT STARTED"
    IN_PROGRESS = "IN PROGRESS"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"


class PurchaseOrderUnit(str, Enum):
    PROCUREMENT = "PROCUREMENT"
    CUTTING = "CUTTING"
    COLLAR = "COLLAR"
    PRINTING = "PRINTING"
    EMBROIDERY = "EMBROIDERY"
    STITCHING = "STITCHING"
    PACKAGING = "PACKAGING"
    UNASSIGNED = "UNASSIGNED"


class PurchaseOrder(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    purchase_order_id: str = Field(
        index=True, unique=True, default_factory=lambda: str(uuid.uuid4())
    )
    order_id: str = Field(foreign_key="order.order_id")
    order: "Order" = Relationship(back_populates="purchase_orders")
    name: str
    product: str
    color: str
    status: PurchaseOrderStatus = Field(default=PurchaseOrderStatus.NOT_STARTED)
    purchase_order_unit: PurchaseOrderUnit = Field(default=PurchaseOrderUnit.UNASSIGNED)
    purchase_order_unit_name: Optional[str] = None
    dependencies: Optional[str] = Field(default="[]")  # JSON list of purchase_order_ids
    incoming_chart: Optional[str] = Field(
        default=None
    )  # JSON string of size chart data
    outgoing_chart: Optional[str] = Field(
        default=None
    )  # JSON string of updated size chart data
    special_notes: Optional[str] = Field(
        default=None, description="Notes specific to this purchase order"
    )


class PurchaseOrderCreate(SQLModel):
    order_id: str
    name: str
    product: str
    color: str
    purchase_order_unit: PurchaseOrderUnit = Field(default=PurchaseOrderUnit.UNASSIGNED)
    purchase_order_unit_name: Optional[str] = None
    status: PurchaseOrderStatus = Field(default=PurchaseOrderStatus.NOT_STARTED)
    dependencies: List[str] = []  # List of purchase_order_ids
    special_notes: Optional[str] = None


class PurchaseOrderUpdate(SQLModel):
    name: Optional[str] = None
    product: Optional[str] = None
    color: Optional[str] = None
    purchase_order_unit: Optional[PurchaseOrderUnit] = None
    purchase_order_unit_name: Optional[str] = None
    status: Optional[PurchaseOrderStatus] = None
    dependencies: Optional[List[str]] = []  # List of purchase_order_ids
    special_notes: Optional[str] = None
