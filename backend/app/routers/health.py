from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database.database import get_session

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check endpoint")
def health_check(session: Session = Depends(get_session)):
    """
    Lightweight health check for app + DB connectivity.
    """
    try:
        session.exec(select(1))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}
