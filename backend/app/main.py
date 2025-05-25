from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from app.database.database import engine
import uvicorn

from app.routers.orders import router as orders_router
from app.routers.tasks import router as tasks_router
from app.routers.inventory import router as inventory_router
from app.utils.logger_setup import logger
from app.utils.process_app_config import process_app_config

# Process Config at Startup
app_config = process_app_config()

app = FastAPI()

logger.info("Starting FastAPI application...")
logger.info("Setting up database connection...")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if app_config["db_type"] == "sqlite":
        logger.info("Using SQLite database.")
        # Startup: Create database
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        yield
        # Shutdown: Add cleanup logic here if needed (e.g., closing connections)
        pass


app = FastAPI(lifespan=lifespan)

# Allow requests from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:30000"],  # Exact origin of your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include the product router with the "/products" prefix
app.include_router(orders_router, prefix="/orders")
app.include_router(tasks_router, prefix="/tasks")
app.include_router(inventory_router, prefix="/inventory")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=app_config["backend_host"],
        port=app_config["backend_port"],
        reload=True,
    )
