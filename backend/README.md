# Prelegal backend

FastAPI service that serves the JSON API under `/api/*` and the statically
exported Next.js frontend for everything else.

## Local development

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

By default the SQLite database lives at `backend/data/prelegal.db` and is
recreated from scratch on every startup. Override the location with the
`DATABASE_PATH` env var.

To serve the frontend locally, build it first and point `STATIC_DIR` at the
export output:

```bash
cd ../frontend && npm run build
cd ../backend && STATIC_DIR=../frontend/out uv run uvicorn app.main:app --port 8000
```

## Tests

```bash
uv run pytest
```
