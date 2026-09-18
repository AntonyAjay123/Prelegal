import os
from collections.abc import Iterator
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models import Base

DEFAULT_DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "prelegal.db"


def get_database_path() -> Path:
    return Path(os.environ.get("DATABASE_PATH", str(DEFAULT_DATABASE_PATH)))


@lru_cache
def _get_engine(db_path: str) -> Engine:
    return create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})


def get_engine() -> Engine:
    return _get_engine(str(get_database_path()))


def reset_db() -> None:
    """Delete any existing SQLite file and recreate the schema from scratch."""
    db_path = get_database_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)

    _get_engine(str(db_path)).dispose()
    _get_engine.cache_clear()
    if db_path.exists():
        db_path.unlink()

    Base.metadata.create_all(get_engine())


def get_session() -> Iterator[Session]:
    session = sessionmaker(bind=get_engine())()
    try:
        yield session
    finally:
        session.close()
