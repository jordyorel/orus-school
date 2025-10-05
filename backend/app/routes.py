from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models, schemas
from .database import get_db
from .deps import get_current_user, require_admin, require_student
from .security import create_access_token, get_password_hash, verify_password

router = APIRouter()

auth_router = APIRouter(prefix="/auth", tags=["auth"])
course_router = APIRouter(prefix="/courses", tags=["courses"])
project_router = APIRouter(prefix="/projects", tags=["projects"])
progress_router = APIRouter(prefix="/progress", tags=["progress"])
user_router = APIRouter(prefix="/users", tags=["users"])


@auth_router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.execute(select(models.User).where(models.User.email == payload.email)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = models.User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role="student",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@auth_router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.execute(select(models.User).where(models.User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")

    access_token = create_access_token(user_id=user.id, role=user.role)
    return schemas.Token(access_token=access_token)


@auth_router.get("/me", response_model=schemas.User)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user


@course_router.get("", response_model=List[schemas.Course])
def list_courses(year: Optional[int] = None, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    stmt = select(models.Course).order_by(models.Course.year, models.Course.order_index)
    if year is not None:
        stmt = stmt.where(models.Course.year == year)
    courses = db.execute(stmt).scalars().all()
    return courses


@course_router.post("", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
def create_course(payload: schemas.CourseCreate, db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    course = models.Course(**payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@project_router.get("", response_model=List[schemas.Project])
def list_projects(
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    stmt = select(models.Project)
    if current_user.role == "student":
        stmt = stmt.where(models.Project.student_id == current_user.id)
    elif student_id is not None:
        stmt = stmt.where(models.Project.student_id == student_id)
    projects = db.execute(stmt.order_by(models.Project.id.desc())).scalars().all()
    return projects


@project_router.post("/submit", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def submit_project(
    payload: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    course = db.get(models.Course, payload.course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    project = models.Project(
        title=payload.title,
        description=payload.description,
        course_id=payload.course_id,
        github_link=payload.github_link,
        student_id=current_user.id,
        status="submitted",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@project_router.patch("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    payload: schemas.ProjectUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    project = db.get(models.Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "score":
            continue
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    if payload.status and payload.status.lower() == "completed":
        _mark_course_completed(db, project.student_id, project.course_id, payload.score)

    if payload.score is not None:
        _mark_course_completed(db, project.student_id, project.course_id, payload.score)

    db.refresh(project)
    return project


def _mark_course_completed(db: Session, student_id: int, course_id: int, score: Optional[int]) -> None:
    progress = (
        db.execute(
            select(models.Progress).where(
                models.Progress.student_id == student_id, models.Progress.course_id == course_id
            )
        )
        .scalar_one_or_none()
    )
    if progress is None:
        progress = models.Progress(student_id=student_id, course_id=course_id)
        db.add(progress)

    progress.completed = True
    if score is not None:
        progress.score = score
    db.commit()


@progress_router.get("/{student_id}", response_model=schemas.ProgressResponse)
def read_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    student = db.get(models.User, student_id)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    courses = db.execute(select(models.Course).order_by(models.Course.year, models.Course.order_index)).scalars().all()
    progress_entries = db.execute(
        select(models.Progress).where(models.Progress.student_id == student_id)
    ).scalars().all()

    completed_count = sum(1 for entry in progress_entries if entry.completed)
    total_courses = len(courses)
    completion_rate = (completed_count / total_courses) * 100 if total_courses else 0.0

    return schemas.ProgressResponse(
        student=student,
        courses=courses,
        progress=progress_entries,
        completion_rate=completion_rate,
    )


@user_router.get("", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    users = db.execute(select(models.User).order_by(models.User.name)).scalars().all()
    return users
