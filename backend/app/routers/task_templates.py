from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.models import TaskTemplate, TaskTemplateCreate
from app.database import get_session
from typing import List

router = APIRouter()


@router.post("/", response_model=TaskTemplate)
def create_task_template(
    task_template: TaskTemplateCreate, session: Session = Depends(get_session)
):
    db_task_template = TaskTemplate(**task_template.model_dump())
    session.add(db_task_template)
    session.commit()
    session.refresh(db_task_template)
    return db_task_template


@router.get("/", response_model=List[TaskTemplate])
def read_task_templates(session: Session = Depends(get_session)):
    task_templates = session.exec(select(TaskTemplate)).all()
    return task_templates
