# Dockerfile for FastAPI backend
FROM python:3.12-slim


COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
# Copy the pyproject.toml file first to cache the dependencies layer

COPY pyproject.toml /workdir/pyproject.toml
# Set working directory
WORKDIR /workdir

# Create sqlite folder before anything else
RUN mkdir -p /workdir/sqllite

RUN uv venv
RUN uv sync

COPY . .

# Copy the entrypoint script
RUN chmod +x backend_entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["/workdir/backend_entrypoint.sh"]
