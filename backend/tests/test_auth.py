import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DB_PATH = BACKEND_DIR / "test_auth.db"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app


client = TestClient(app)


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def cleanup_database_file() -> None:
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


def test_register_and_login_flow() -> None:
    reset_database()
    try:
        register_payload = {"name": "Integration Tester", "email": "tester@example.com", "password": "supersecret"}
        register_response = client.post("/auth/register", json=register_payload)
        assert register_response.status_code == 201
        user_data = register_response.json()
        assert user_data["email"] == register_payload["email"]
        assert user_data["role"] == "student"

        login_response = client.post(
            "/auth/login", json={"email": register_payload["email"], "password": register_payload["password"]}
        )
        assert login_response.status_code == 200
        token_data = login_response.json()
        assert token_data["access_token"]

        me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token_data['access_token']}"})
        assert me_response.status_code == 200
        profile = me_response.json()
        assert profile["email"] == register_payload["email"]
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        cleanup_database_file()
