from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.student import Student
from ..schemas.student import StudentCreate, StudentRead, TokenResponse
from ..utils.hashing import hash_password, verify_password
from ..utils.token import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def register_student(student_in: StudentCreate, db: Session = Depends(get_db)) -> Student:
    existing_student = db.query(Student).filter(Student.email == student_in.email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    student = Student(
        full_name=student_in.full_name,
        email=student_in.email,
        hashed_password=hash_password(student_in.password),
        avatar_url=student_in.avatar_url,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.post("/login", response_model=TokenResponse)
def login(
    request: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    student = db.query(Student).filter(Student.email == request.username).first()
    if student is None or not verify_password(request.password, student.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(data={"sub": student.email})
    return TokenResponse(access_token=access_token, token_type="bearer")
