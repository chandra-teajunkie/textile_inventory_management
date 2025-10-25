#!/bin/sh
set -e  # Exit immediately if a command fails

# Log environment configuration for debugging (optional)
echo "🚀 Starting backend with the following configuration:"
echo "DB_TYPE: ${DB_TYPE:-sqlite}"
echo "POSTGRES_HOST: ${POSTGRES_HOST:-localhost}"
echo "POSTGRES_PORT: ${POSTGRES_PORT:-5432}"
echo "POSTGRES_DB: ${POSTGRES_DB:-sidhu_textiles_db}"
echo "POSTGRES_USER: ${POSTGRES_USER:-sidhu_textiles_user}"
echo "PORT: ${PORT:-3002}"

# Ensure DB tables exist (optional)
echo "📦 Running database initialization..."
/workdir/.venv/bin/python -m app.database.init || echo "Skipping init (optional)"

# Start FastAPI
echo "🚀 Launching FastAPI on port ${PORT:-3002}..."
exec /workdir/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-3002}"
