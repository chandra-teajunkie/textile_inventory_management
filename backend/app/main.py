from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from app.database import engine
import uvicorn

from app.routers.orders import router as orders_router
from app.routers.tasks import router as tasks_router

app = FastAPI()




@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    SQLModel.metadata.create_all(engine)
    yield
    # Shutdown: Add cleanup logic here if needed (e.g., closing connections)
    pass


app = FastAPI(lifespan=lifespan)

# Allow requests from your frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # or ["*"] for all origins (not recommended for prod)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the product router with the "/products" prefix
app.include_router(orders_router, prefix="/orders")
app.include_router(tasks_router, prefix="/tasks")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=3002, reload=True)
