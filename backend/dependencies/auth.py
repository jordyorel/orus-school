from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.student import Student
from ..utils.token import decode_access_token, oauth2_scheme


def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Student:
    email = decode_access_token(token)
    student = db.query(Student).filter(Student.email == email).first()
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return student
