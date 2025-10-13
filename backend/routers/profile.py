from fastapi import APIRouter, Depends

from ..dependencies.auth import get_current_student
from ..models.student import Student
from ..schemas.student import StudentRead

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=StudentRead)
def read_own_profile(current_student: Student = Depends(get_current_student)) -> Student:
    return current_student
