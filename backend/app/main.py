from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from app.database.database import engine
import uvicorn
import os
from app.routers.purchase_orders import router as purchase_orders_router
from app.routers.tasks import router as tasks_router
from app.routers.inventory import router as inventory_router
from app.routers.health import router as health_router
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


def get_cors_origins():
    cors_origins = os.getenv("CORS_ORIGINS", "")

    if cors_origins.strip() == "":
        # fallback for local dev - include various common ports
        return [
            "http://localhost:3000", 
            "http://localhost:30000", 
            "http://127.0.0.1:3000", 
            "http://127.0.0.1:30000",
            "http://localhost:5173", 
            "http://127.0.0.1:5173"
        ]

    return [origin.strip() for origin in cors_origins.split(",")]


origins = get_cors_origins()

print("✅ CORS allowed origins:", origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware has been set up.")

# Include the product router with the "/products" prefix
app.include_router(purchase_orders_router, prefix="/purchase-orders")
app.include_router(tasks_router, prefix="/tasks")
app.include_router(inventory_router, prefix="/inventory")
app.include_router(health_router, prefix="/health")
logger.info("Routers have been included.")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=app_config["backend_host"],
        port=app_config["backend_port"],
        reload=True,
    )
