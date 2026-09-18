import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import health, mutual_nda_chat
from app.db import reset_db
from app.services.mutual_nda_chat import ChatServiceUnavailableError

DEFAULT_STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def get_static_dir() -> Path:
    return Path(os.environ.get("STATIC_DIR", str(DEFAULT_STATIC_DIR)))


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    reset_db()
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(health.router, prefix="/api")
app.include_router(mutual_nda_chat.router, prefix="/api")


@app.exception_handler(ChatServiceUnavailableError)
async def chat_service_unavailable_handler(
    request: Request, exc: ChatServiceUnavailableError
) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"detail": "The AI assistant is temporarily unavailable. Please try again shortly."},
    )

static_dir = get_static_dir()
next_assets_dir = static_dir / "_next"
if next_assets_dir.is_dir():
    app.mount("/_next", StaticFiles(directory=next_assets_dir), name="next-static")


@app.get("/{full_path:path}")
def serve_frontend(full_path: str) -> FileResponse:
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    candidates = (
        [static_dir / "index.html"]
        if full_path == ""
        else [
            static_dir / f"{full_path}.html",
            static_dir / full_path / "index.html",
            static_dir / "index.html",
        ]
    )
    for candidate in candidates:
        if candidate.is_file():
            return FileResponse(candidate)

    raise HTTPException(status_code=404, detail="Not found")
