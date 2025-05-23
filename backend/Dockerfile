# Dockerfile for FastAPI backend
FROM python:3.12-slim


COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
# Copy the pyproject.toml file first to cache the dependencies layer

COPY backend/pyproject.toml /workdir/pyproject.toml
# Set working directory
WORKDIR /workdir

RUN uv venv
RUN uv sync

COPY backend /workdir

EXPOSE 3002

# Run the FastAPI app with uvicorn
CMD ["/workdir/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
