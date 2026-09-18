from sqlalchemy import inspect

from app.db import get_engine, reset_db


def test_reset_db_creates_users_table(isolated_database):
    inspector = inspect(get_engine())

    assert "users" in inspector.get_table_names()

    columns = {col["name"] for col in inspector.get_columns("users")}
    assert columns == {"id", "email", "hashed_password", "created_at"}


def test_reset_db_recreates_file(isolated_database):
    assert isolated_database.exists()

    isolated_database.write_bytes(b"not a real sqlite file")
    reset_db()

    assert isolated_database.exists()
    assert isolated_database.read_bytes() != b"not a real sqlite file"
