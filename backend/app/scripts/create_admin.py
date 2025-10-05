"""Utility script to create an admin user for the Orus School API."""

from getpass import getpass

from sqlalchemy import select

from ..database import Base, SessionLocal, engine
from ..models import User
from ..security import get_password_hash


def main() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        name = input("Admin name: ")
        email = input("Admin email: ")
        password = getpass("Password: ")
        confirm_password = getpass("Confirm password: ")

        if password != confirm_password:
            raise SystemExit("Passwords do not match.")

        existing = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if existing:
            raise SystemExit("A user with this email already exists.")

        admin = User(name=name, email=email, role="admin", password_hash=get_password_hash(password))
        session.add(admin)
        session.commit()
        print("Admin account created successfully.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
