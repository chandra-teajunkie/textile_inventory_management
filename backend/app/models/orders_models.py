from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .tasks_models import Task  # Import Task model


class Order(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: str = Field(index=True, unique=True)
    number_of_overall_pieces: int
    types: str
    colors: str
    design_specs: Optional[str] = None
    customer_id: str
    order_date: datetime
    start_date: datetime
    due_date: datetime
    special_notes: Optional[str] = None
    tasks: List["Task"] = Relationship(back_populates="order")  # Relationship to Task
    size_chart: Optional[str] = Field(default=None)  # JSON string for size chart


class OrderCreate(SQLModel):
    number_of_overall_pieces: int
    types: str
    colors: str
    design_specs: Optional[str] = None
    customer_id: str
    order_date: datetime
    start_date: datetime
    due_date: datetime
    special_notes: Optional[str] = None


class OrderUpdate(SQLModel):
    number_of_overall_pieces: Optional[int] = None
    types: Optional[str] = None
    colors: Optional[str] = None
    design_specs: Optional[str] = None
    customer_id: Optional[str] = None
    order_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    special_notes: Optional[str] = None
    size_chart: Optional[str] = Field(default=None)
