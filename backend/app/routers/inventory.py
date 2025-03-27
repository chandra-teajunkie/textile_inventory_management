from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models.inventory_models import Inventory, InventoryCreate, InventoryUpdate
from typing import List
from app.utils.utils import generate_unique_id

router = APIRouter()


@router.post("/", response_model=Inventory)
def create_inventory(
    inventory: InventoryCreate, session: Session = Depends(get_session)
):
    # Generate a unique inventory_id using the utility function
    unique_inventory_id = generate_unique_id(Inventory, session, "inventory_id")

    # Create Inventory entry using unpacking for InventoryCreate fields
    db_inventory = Inventory(
        inventory_id=unique_inventory_id,  # Assign the unique ID
        **inventory.model_dump(),  # Unpacks all fields from InventoryCreate model
    )

    session.add(db_inventory)
    session.commit()
    session.refresh(db_inventory)

    return db_inventory


# Get all inventory items
@router.get("/", response_model=List[Inventory])
def read_inventory(session: Session = Depends(get_session)):
    return session.exec(select(Inventory)).all()


# Get a specific inventory item by ID
@router.get("/{inventory_id}", response_model=Inventory)
def read_inventory_item(inventory_id: str, session: Session = Depends(get_session)):
    inventory = session.exec(
        select(Inventory).where(Inventory.inventory_id == inventory_id)
    ).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return inventory


# Update an inventory item
@router.patch("/{inventory_id}", response_model=Inventory)
def update_inventory(
    inventory_id: str,
    inventory_update: InventoryUpdate,
    session: Session = Depends(get_session),
):
    db_inventory = session.exec(
        select(Inventory).where(Inventory.inventory_id == inventory_id)
    ).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    update_data = inventory_update.model_dump(
        exclude_unset=True
    )  # Only fields that are set
    for key, value in update_data.items():
        setattr(db_inventory, key, value)

    session.add(db_inventory)
    session.commit()
    session.refresh(db_inventory)
    return db_inventory


# Delete an inventory item
@router.delete("/{inventory_id}")
def delete_inventory(inventory_id: str, session: Session = Depends(get_session)):
    db_inventory = session.exec(
        select(Inventory).where(Inventory.inventory_id == inventory_id)
    ).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    session.delete(db_inventory)
    session.commit()
    return {"message": "Inventory item deleted successfully"}
