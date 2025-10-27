from fastapi import APIRouter, Depends

from backend.dependencies.auth import get_current_student
from backend.models.student import Student
from backend.schemas.student import StudentRead

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=StudentRead)
def read_own_profile(current_student: Student = Depends(get_current_student)) -> Student:
    return current_student
