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

# from dotenv import load_dotenv

# # Load variables from .env file
# load_dotenv()


# Process Config at Startup
app_config = process_app_config()

app = FastAPI()

logger.info("Starting FastAPI application...")
logger.info("Setting up database connection...")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Using {app_config['db_type'].upper()} database.")
    # Startup: Create tables for both sqlite and postgres
    logger.info("Creating database tables...")
    SQLModel.metadata.create_all(engine)

    yield

    # Shutdown logic (optional)
    pass


app = FastAPI(lifespan=lifespan)

# Allow requests from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sidhu-textiles.onrender.com",  # ✅ correct deployed frontend
        "http://localhost:3000",  # ✅ optional for local testing
    ],
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
