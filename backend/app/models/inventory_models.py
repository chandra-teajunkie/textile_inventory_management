from typing import Optional
from sqlmodel import Field, SQLModel
import uuid


class Inventory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inventory_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), unique=True, index=True
    )
    storage_location: str
    material_type: str
    color: str
    quantity_weight: float  # In Kg
    quantity_bags: Optional[int] = None  # Optional
    weight_per_bag: Optional[float] = None  # Optional
    material: str  # E.g., Yarn, Cotton, etc.


class InventoryCreate(SQLModel):
    storage_location: str
    material_type: str
    color: str
    quantity_weight: float
    quantity_bags: Optional[int] = None
    weight_per_bag: Optional[float] = None
    material: str


class InventoryUpdate(SQLModel):
    storage_location: Optional[str] = None
    material_type: Optional[str] = None
    color: Optional[str] = None
    quantity_weight: Optional[float] = None
    quantity_bags: Optional[int] = None
    weight_per_bag: Optional[float] = None
    material: Optional[str] = None
