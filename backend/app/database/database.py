import os
import psycopg2
from sqlmodel import create_engine, SQLModel, Session
from app.utils.logger_setup import logger
from app.utils.process_app_config import process_app_config

# Load config at startup
app_config = process_app_config()

# Environment overrides (used when running in Kubernetes / cloud)
db_type = os.getenv("DB_TYPE", app_config.get("db_type", "sqlite")).lower()

if db_type == "postgres":
    POSTGRES_USER = os.getenv("POSTGRES_USER", "sidhu_textiles_user")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "sidhu_textiles_pass")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "sidhu_textiles_db")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")

    DATABASE_URL = (
        f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@"
        f"{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

    # --- 🧩 Ensure the database exists only if possible ---
    try:
        # Connect to default "postgres" database
        conn = psycopg2.connect(
            dbname="postgres",
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (POSTGRES_DB,))
        exists = cur.fetchone()
        if not exists:
            try:
                cur.execute(f"CREATE DATABASE {POSTGRES_DB};")
                logger.info(f"✅ Created missing database: {POSTGRES_DB}")
            except psycopg2.errors.InsufficientPrivilege:
                logger.warning(
                    f"⚠️ User '{POSTGRES_USER}' cannot create database '{POSTGRES_DB}', assuming it already exists."
                )
        cur.close()
        conn.close()
    except Exception as e:
        logger.warning(f"⚠️ Could not verify/create database '{POSTGRES_DB}': {e}")

    logger.info(f"🛠 Using PostgreSQL database at {POSTGRES_HOST}:{POSTGRES_PORT}")

else:
    DATABASE_URL = app_config.get("sql_lite_db_url", "sqlite:///./sqlite/app.db")
    logger.info("🛠 Using SQLite database.")

# Create engine
engine = create_engine(DATABASE_URL, echo=True)


# Dependency: Provide a database session
def get_session():
    with Session(engine) as session:
        yield session


# Initialize tables (used in startup)
def create_db_and_tables():
    logger.info("Creating database tables if not exist...")
    SQLModel.metadata.create_all(engine)
