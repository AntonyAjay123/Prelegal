# --- Stage 1: build the static frontend export ---
FROM node:20-slim AS frontend-build
WORKDIR /repo
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

# --- Stage 2: backend runtime, serving the API + the static frontend ---
FROM python:3.13-slim AS backend
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev
COPY backend/app ./app
COPY --from=frontend-build /repo/frontend/out ./static
COPY templates ./templates
COPY catalog.json ./catalog.json

ENV STATIC_DIR=/app/static
ENV DATABASE_PATH=/app/data/prelegal.db
ENV TEMPLATES_DIR=/app/templates
ENV CATALOG_PATH=/app/catalog.json
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
