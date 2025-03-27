from fastapi import UploadFile, HTTPException
from sqlmodel import select
import uuid
import pandas as pd
from io import StringIO
from typing import Optional


def generate_unique_id(model, session, field_name: str):
    """Generate a unique UUID for a given model and field."""
    while True:
        unique_id = str(uuid.uuid4())
        # Dynamically check for the field in the model
        existing_item = session.exec(
            select(model).where(getattr(model, field_name) == unique_id)
        ).first()
        if not existing_item:
            return unique_id


async def process_size_chart(size_chart_file: Optional[UploadFile]) -> Optional[str]:
    """Process the uploaded size chart file and convert it to JSON."""
    if size_chart_file:
        try:
            contents = await size_chart_file.read()
            df = pd.read_csv(StringIO(contents.decode("utf-8")))
            return df.to_json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing file: {e}")
    return None
