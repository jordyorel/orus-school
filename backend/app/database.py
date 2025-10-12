import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


def _default_sqlite_path() -> Path:
    """Return the default path for the SQLite database file.

    The goal is to persist data on the host machine even when the backend is
    running inside Docker. We therefore keep the database file alongside the
    project sources (``backend/data/orus_school.db`` when running locally and
    ``/app/data/orus_school.db`` in the container). The directory is created on
    demand so first-time runs succeed without manual setup.
    """

    configured_path = os.getenv("SQLITE_PATH")
    if configured_path:
        return Path(configured_path).expanduser().absolute()

    project_root = Path(__file__).resolve().parent.parent
    return (project_root / "data" / "orus_school.db").absolute()


if db_url := os.getenv("DATABASE_URL"):
    DATABASE_URL = db_url
else:
    sqlite_path = _default_sqlite_path()
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    DATABASE_URL = f"sqlite:///{sqlite_path.as_posix()}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
