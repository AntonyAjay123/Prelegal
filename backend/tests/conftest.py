import pytest


@pytest.fixture(autouse=True)
def isolated_database(tmp_path, monkeypatch):
    """Point every test at a throwaway SQLite file instead of the dev database."""
    db_path = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_PATH", str(db_path))

    from app.db import reset_db

    reset_db()

    yield db_path
