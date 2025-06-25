from sqlmodel import create_engine, SQLModel, Session
from app.utils.logger_setup import logger
from app.utils.process_app_config import process_app_config

# Process Config at Startup
app_config = process_app_config()

# Determine DB engine
if app_config["db_type"] == "sqlite":
    DATABASE_URL = app_config["sql_lite_db_url"]
    logger.info("🛠 Using SQLite database.")
elif app_config["db_type"] == "postgres":
    DATABASE_URL = app_config["postgres_url"]
    logger.info("🛠 Using PostgreSQL database.")
else:
    raise ValueError(f"Unsupported db_type: {app_config['db_type']}")
engine = create_engine(DATABASE_URL, echo=True)


def get_session():
    if app_config["db_type"] == "sqlite":
        logger.info("Using SQLite database.")
        with Session(engine) as session:
            yield session


def create_db_and_tables():
    if app_config["db_type"] == "sqlite":
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
