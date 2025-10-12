from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from uuid import uuid4

import mimetypes
import shutil

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status, Request
from fastapi.responses import StreamingResponse, Response
from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from . import models, schemas
from .code_runner import ExecutionError, run_code
from .database import get_db
from .deps import get_current_user, require_admin, require_student
from .security import create_access_token, get_password_hash, verify_password

auth_router = APIRouter(prefix="/auth", tags=["auth"])
course_router = APIRouter(prefix="/courses", tags=["courses"])
lesson_router = APIRouter(prefix="/lessons", tags=["lessons"])
project_router = APIRouter(prefix="/projects", tags=["projects"])
progress_router = APIRouter(prefix="/progress", tags=["progress"])
user_router = APIRouter(prefix="/users", tags=["users"])
execution_router = APIRouter(tags=["execution"])
learning_router = APIRouter(tags=["learning"])
admin_router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])
video_router = APIRouter(prefix="/videos", tags=["videos"])

MEDIA_ROOT = Path(__file__).resolve().parent / "media"
VIDEO_UPLOAD_DIR = MEDIA_ROOT / "videos"
VIDEO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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


@course_router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    course = db.get(models.Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    db.delete(course)
    db.commit()


@lesson_router.get("/{course_id}", response_model=schemas.CourseLessonsResponse)
def read_course_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    course = db.get(models.Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    lessons = (
        db.execute(
            select(models.Lesson)
            .where(models.Lesson.course_id == course_id)
            .order_by(models.Lesson.order_index)
        )
        .scalars()
        .all()
    )

    lesson_ids = [lesson.id for lesson in lessons]
    exercise_map: Dict[int, List[models.Exercise]] = {lesson_id: [] for lesson_id in lesson_ids}
    if lesson_ids:
        exercises = (
            db.execute(
                select(models.Exercise)
                .where(models.Exercise.lesson_id.in_(lesson_ids))
                .order_by(models.Exercise.order_index)
            )
            .scalars()
            .all()
        )
        for exercise in exercises:
            exercise_map.setdefault(exercise.lesson_id, []).append(exercise)

    test_counts: Dict[int, int] = {}
    if exercise_map:
        exercise_ids = [exercise.id for exercises in exercise_map.values() for exercise in exercises]
        if exercise_ids:
            rows = (
                db.execute(
                    select(models.ExerciseTest.exercise_id, models.ExerciseTest.id)
                    .where(models.ExerciseTest.exercise_id.in_(exercise_ids))
                )
                .all()
            )
            for exercise_id, _ in rows:
                test_counts[exercise_id] = test_counts.get(exercise_id, 0) + 1

    lesson_progress_entries: List[models.LessonProgress] = []
    if lesson_ids:
        lesson_progress_entries = (
            db.execute(
                select(models.LessonProgress).where(
                    and_(
                        models.LessonProgress.student_id == current_user.id,
                        models.LessonProgress.lesson_id.in_(lesson_ids),
                    )
                )
            )
            .scalars()
            .all()
        )
    lesson_progress_map = {entry.lesson_id: entry for entry in lesson_progress_entries}

    exercise_progress_entries = []
    if exercise_map:
        exercise_ids = [exercise.id for exercises in exercise_map.values() for exercise in exercises]
        if exercise_ids:
            exercise_progress_entries = (
                db.execute(
                    select(models.ExerciseProgress).where(
                        and_(
                            models.ExerciseProgress.student_id == current_user.id,
                            models.ExerciseProgress.exercise_id.in_(exercise_ids),
                        )
                    )
                )
                .scalars()
                .all()
            )
    exercise_progress_map = {entry.exercise_id: entry for entry in exercise_progress_entries}

    lesson_details: List[schemas.LessonDetail] = []
    for lesson in lessons:
        lesson_progress = lesson_progress_map.get(lesson.id)
        exercises = []
        for exercise in exercise_map.get(lesson.id, []):
            progress = exercise_progress_map.get(exercise.id)
            exercises.append(
                schemas.ExerciseDetail(
                    id=exercise.id,
                    lesson_id=exercise.lesson_id,
                    title=exercise.title,
                    instructions=exercise.instructions,
                    starter_code=exercise.starter_code or {},
                    default_language=exercise.default_language,
                    order_index=exercise.order_index,
                    tests_count=test_counts.get(exercise.id, 0),
                    progress=(
                        schemas.ExerciseProgressInfo(
                            status=progress.status,
                            completed_at=progress.completed_at,
                            last_run_output=progress.last_run_output,
                            last_error=progress.last_error,
                            last_language=progress.last_language,
                        )
                        if progress
                        else None
                    ),
                )
            )
        lesson_details.append(
            schemas.LessonDetail(
                id=lesson.id,
                course_id=lesson.course_id,
                title=lesson.title,
                description=lesson.description,
                video_url=lesson.video_url,
                notes=lesson.notes,
                order_index=lesson.order_index,
                progress=(
                    schemas.LessonProgressInfo(
                        completed=lesson_progress.completed,
                        completed_at=lesson_progress.completed_at,
                    )
                    if lesson_progress
                    else None
                ),
                exercises=exercises,
            )
        )

    course_summary = _build_course_summary(course, lesson_details)

    return schemas.CourseLessonsResponse(course=course, lessons=lesson_details, course_progress=course_summary)


@course_router.get("/{course_id}/lessons/{lesson_id}", response_model=schemas.LessonDetail)
def read_course_lesson_detail(
    course_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    lesson = db.get(models.Lesson, lesson_id)
    if lesson is None or lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    return _build_lesson_detail(db, lesson, current_user.id)


@course_router.get("/{course_id}/lessons/{lesson_id}/next", response_model=schemas.LessonDetail)
def read_next_course_lesson(
    course_id: int,
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    current_lesson = db.get(models.Lesson, lesson_id)
    if current_lesson is None or current_lesson.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    lessons = (
        db.execute(
            select(models.Lesson)
            .where(models.Lesson.course_id == course_id)
            .order_by(models.Lesson.order_index, models.Lesson.id)
        )
        .scalars()
        .all()
    )

    next_lesson = None
    for index, lesson in enumerate(lessons):
        if lesson.id == current_lesson.id and index + 1 < len(lessons):
            next_lesson = lessons[index + 1]
            break

    if next_lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No next lesson")

    return _build_lesson_detail(db, next_lesson, current_user.id)


@admin_router.post("/lessons", response_model=schemas.LessonDetail, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    title: str = Form(...),
    description: str = Form(...),
    course_id: int = Form(...),
    notes: str = Form(""),
    order_index: Optional[int] = Form(None),
    video_file: Optional[UploadFile] = None,
    db: Session = Depends(get_db),
):
    course = db.get(models.Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    video_url: Optional[str] = None
    if video_file and video_file.filename:
        extension = Path(video_file.filename).suffix
        unique_name = f"{uuid4().hex}{extension}"
        destination = VIDEO_UPLOAD_DIR / unique_name
        await video_file.seek(0)
        with destination.open("wb") as buffer:
            shutil.copyfileobj(video_file.file, buffer)
        video_url = f"/videos/{unique_name}"

    if order_index is None:
        max_order = (
            db.execute(
                select(models.Lesson.order_index)
                .where(models.Lesson.course_id == course_id)
                .order_by(models.Lesson.order_index.desc())
            )
            .scalars()
            .first()
        )
        order_index = (max_order or 0) + 1

    lesson = models.Lesson(
        title=title,
        description=description,
        course_id=course_id,
        notes=notes,
        video_url=video_url,
        order_index=order_index,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return _build_lesson_detail(db, lesson, None)


@admin_router.patch("/lessons/{lesson_id}", response_model=schemas.LessonDetail)
async def update_lesson(
    lesson_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    course_id: Optional[int] = Form(None),
    order_index: Optional[int] = Form(None),
    video_file: Optional[UploadFile] = None,
    db: Session = Depends(get_db),
):
    lesson = db.get(models.Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    if course_id is not None and course_id != lesson.course_id:
        course = db.get(models.Course, course_id)
        if course is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
        lesson.course_id = course_id

    if title is not None:
        lesson.title = title
    if description is not None:
        lesson.description = description
    if notes is not None:
        lesson.notes = notes
    if order_index is not None:
        lesson.order_index = order_index

    if video_file and video_file.filename:
        extension = Path(video_file.filename).suffix
        unique_name = f"{uuid4().hex}{extension}"
        destination = VIDEO_UPLOAD_DIR / unique_name
        await video_file.seek(0)
        with destination.open("wb") as buffer:
            shutil.copyfileobj(video_file.file, buffer)
        lesson.video_url = f"/videos/{unique_name}"

    db.add(lesson)
    db.commit()
    db.refresh(lesson)

    return _build_lesson_detail(db, lesson, None)


@admin_router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = db.get(models.Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    db.delete(lesson)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _video_headers(file_size: int) -> Dict[str, str]:
    return {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
    }


@video_router.head("/{filename}")
async def head_video(filename: str):
    file_path = VIDEO_UPLOAD_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    file_size = file_path.stat().st_size
    media_type, _ = mimetypes.guess_type(str(file_path))
    media_type = media_type or "video/mp4"
    return Response(status_code=status.HTTP_200_OK, media_type=media_type, headers=_video_headers(file_size))


@video_router.get("/{filename}")
async def stream_video(filename: str, request: Request):
    file_path = VIDEO_UPLOAD_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

    file_size = file_path.stat().st_size
    range_header = request.headers.get("range")
    media_type, _ = mimetypes.guess_type(str(file_path))
    media_type = media_type or "video/mp4"

    def iter_file(start: int = 0, end: Optional[int] = None):
        with file_path.open("rb") as video:
            video.seek(start)
            remaining = (end - start + 1) if end is not None else None
            chunk_size = 1024 * 1024
            while True:
                if remaining is not None and remaining <= 0:
                    break
                read_size = chunk_size if remaining is None else min(chunk_size, remaining)
                data = video.read(read_size)
                if not data:
                    break
                if remaining is not None:
                    remaining -= len(data)
                yield data

    if range_header:
        bytes_unit, _, range_value = range_header.partition("=")
        if bytes_unit.strip().lower() != "bytes":
            raise HTTPException(status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
        start_str, _, end_str = range_value.partition("-")
        try:
            start = int(start_str)
        except ValueError:
            start = 0
        end = int(end_str) if end_str else file_size - 1
        if start >= file_size or end >= file_size:
            raise HTTPException(status_code=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
        content_length = end - start + 1
        headers = _video_headers(file_size)
        headers.update({
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(content_length),
        })
        return StreamingResponse(
            iter_file(start, end),
            status_code=status.HTTP_206_PARTIAL_CONTENT,
            media_type=media_type,
            headers=headers,
        )

    headers = _video_headers(file_size)
    return StreamingResponse(iter_file(), media_type=media_type, headers=headers)


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

    lesson_progress_entries = (
        db.execute(
            select(models.LessonProgress).where(models.LessonProgress.student_id == student_id)
        )
        .scalars()
        .all()
    )
    exercise_progress_entries = (
        db.execute(
            select(models.ExerciseProgress).where(models.ExerciseProgress.student_id == student_id)
        )
        .scalars()
        .all()
    )

    lesson_progress_map = {entry.lesson_id: entry for entry in lesson_progress_entries}
    exercise_progress_map = {entry.exercise_id: entry for entry in exercise_progress_entries}

    course_summaries: List[schemas.CourseProgressSummary] = []
    previous_course_completed = True
    total_tasks = 0
    total_completed = 0
    for course in courses:
        lessons = sorted(course.lessons, key=lambda lesson: lesson.order_index)
        exercises = [
            exercise
            for lesson in lessons
            for exercise in sorted(lesson.exercises, key=lambda item: item.order_index)
        ]
        lessons_total = len(lessons)
        lessons_completed = sum(
            1 for lesson in lessons if lesson_progress_map.get(lesson.id, None) and lesson_progress_map[lesson.id].completed
        )
        exercises_total = len(exercises)
        exercises_completed = sum(
            1
            for exercise in exercises
            if (exercise_progress := exercise_progress_map.get(exercise.id)) is not None
            and exercise_progress.status == "passed"
        )

        course_tasks_total = lessons_total + exercises_total
        course_tasks_completed = lessons_completed + exercises_completed
        total_tasks += course_tasks_total
        total_completed += course_tasks_completed

        if not previous_course_completed:
            status = "locked"
        elif course_tasks_total == 0:
            status = "in_progress"
        elif course_tasks_completed == course_tasks_total:
            status = "completed"
        else:
            status = "in_progress"

        course_summaries.append(
            schemas.CourseProgressSummary(
                course=course,
                status=status,
                completion_percentage=(course_tasks_completed / course_tasks_total * 100) if course_tasks_total else 0.0,
                lessons_completed=lessons_completed,
                lessons_total=lessons_total,
                exercises_completed=exercises_completed,
                exercises_total=exercises_total,
            )
        )
        previous_course_completed = status == "completed"

    overall_completion = (total_completed / total_tasks * 100) if total_tasks else 0.0

    lesson_records = [
        schemas.LessonProgressRecord(
            lesson_id=entry.lesson_id,
            completed=entry.completed,
            completed_at=entry.completed_at,
        )
        for entry in lesson_progress_entries
    ]
    exercise_records = [
        schemas.ExerciseProgressRecord(
            exercise_id=entry.exercise_id,
            status=entry.status,
            completed_at=entry.completed_at,
            last_language=entry.last_language,
        )
        for entry in exercise_progress_entries
    ]

    return schemas.ProgressResponse(
        student=student,
        courses=course_summaries,
        lesson_progress=lesson_records,
        exercise_progress=exercise_records,
        overall_completion_rate=overall_completion,
    )


@execution_router.post("/run-code", response_model=schemas.RunCodeResponse)
def execute_code(
    payload: schemas.RunCodeRequest,
    _: models.User = Depends(get_current_user),
):
    try:
        result = run_code(payload.language, payload.code, stdin=payload.stdin)
    except ExecutionError as exc:  # pragma: no cover - defensive clause
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return schemas.RunCodeResponse(
        stdout=str(result["stdout"]),
        stderr=str(result["stderr"]),
        exit_code=int(result["exit_code"]),
        execution_time=float(result["execution_time"]),
    )


@execution_router.post("/run-tests", response_model=schemas.RunTestsResponse)
def execute_tests(
    payload: schemas.RunTestsRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    exercise = db.get(models.Exercise, payload.exercise_id)
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    tests = sorted(exercise.tests, key=lambda test: test.id)
    if not tests:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Exercise has no tests configured")

    results: List[schemas.TestCaseResult] = []
    all_passed = True

    for test in tests:
        try:
            execution = run_code(payload.language, payload.code, stdin=test.input_data)
        except ExecutionError as exc:  # pragma: no cover - defensive clause
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        stdout = str(execution["stdout"])
        stderr = str(execution["stderr"])
        exit_code = int(execution["exit_code"])
        expected_output = test.expected_output.strip()
        actual_output = stdout.strip()
        passed = exit_code == 0 and actual_output == expected_output
        results.append(
            schemas.TestCaseResult(
                test_id=test.id,
                passed=passed,
                stdout=stdout,
                stderr=stderr,
                expected_output=test.expected_output,
                input_data=test.input_data,
            )
        )
        if not passed:
            all_passed = False
        if exit_code != 0:
            break

    progress = _get_or_create_exercise_progress(db, current_user.id, exercise.id)
    if all_passed:
        progress.status = "passed"
        progress.last_error = None
        progress.completed_at = datetime.utcnow()
    else:
        progress.status = "failed"
        progress.completed_at = None
        progress.last_error = results[-1].stderr if results else None
    progress.last_run_output = results[-1].stdout if results else None
    progress.last_language = payload.language

    db.commit()
    _sync_course_completion(db, current_user.id, exercise.lesson.course_id)

    return schemas.RunTestsResponse(passed_all=all_passed, results=results)


@learning_router.post("/mark-lesson-complete", response_model=schemas.LessonProgress)
def mark_lesson_complete(
    payload: schemas.MarkLessonCompleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student),
):
    lesson = db.get(models.Lesson, payload.lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    progress = _get_or_create_lesson_progress(db, current_user.id, payload.lesson_id)
    progress.completed = True
    progress.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    _sync_course_completion(db, current_user.id, lesson.course_id)

    return progress


@user_router.get("", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), _: models.User = Depends(require_admin)):
    users = db.execute(select(models.User).order_by(models.User.name)).scalars().all()
    return users


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


def _get_or_create_lesson_progress(db: Session, student_id: int, lesson_id: int) -> models.LessonProgress:
    progress = (
        db.execute(
            select(models.LessonProgress).where(
                and_(models.LessonProgress.student_id == student_id, models.LessonProgress.lesson_id == lesson_id)
            )
        )
        .scalar_one_or_none()
    )
    if progress is None:
        progress = models.LessonProgress(student_id=student_id, lesson_id=lesson_id, completed=False)
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


def _get_or_create_exercise_progress(db: Session, student_id: int, exercise_id: int) -> models.ExerciseProgress:
    progress = (
        db.execute(
            select(models.ExerciseProgress).where(
                and_(models.ExerciseProgress.student_id == student_id, models.ExerciseProgress.exercise_id == exercise_id)
            )
        )
        .scalar_one_or_none()
    )
    if progress is None:
        progress = models.ExerciseProgress(student_id=student_id, exercise_id=exercise_id, status="pending")
        db.add(progress)
        db.commit()
        db.refresh(progress)
    return progress


def _sync_course_completion(db: Session, student_id: int, course_id: int) -> None:
    course = db.get(models.Course, course_id)
    if course is None:
        return

    lesson_ids = [lesson.id for lesson in course.lessons]
    exercise_ids = [exercise.id for lesson in course.lessons for exercise in lesson.exercises]

    lessons_completed = 0
    exercises_completed = 0

    if lesson_ids:
        lesson_progress_entries = (
            db.execute(
                select(models.LessonProgress).where(
                    and_(
                        models.LessonProgress.student_id == student_id,
                        models.LessonProgress.lesson_id.in_(lesson_ids),
                    )
                )
            )
            .scalars()
            .all()
        )
        lessons_completed = sum(1 for entry in lesson_progress_entries if entry.completed)

    if exercise_ids:
        exercise_progress_entries = (
            db.execute(
                select(models.ExerciseProgress).where(
                    and_(
                        models.ExerciseProgress.student_id == student_id,
                        models.ExerciseProgress.exercise_id.in_(exercise_ids),
                    )
                )
            )
            .scalars()
            .all()
        )
        exercises_completed = sum(1 for entry in exercise_progress_entries if entry.status == "passed")

    total_lessons = len(lesson_ids)
    total_exercises = len(exercise_ids)

    all_completed = True
    if total_lessons and lessons_completed != total_lessons:
        all_completed = False
    if total_exercises and exercises_completed != total_exercises:
        all_completed = False

    progress = (
        db.execute(
            select(models.Progress).where(
                and_(models.Progress.student_id == student_id, models.Progress.course_id == course_id)
            )
        )
        .scalar_one_or_none()
    )

    if progress is None:
        progress = models.Progress(student_id=student_id, course_id=course_id)
        db.add(progress)

    progress.completed = all_completed
    db.commit()


def _build_lesson_detail(
    db: Session, lesson: models.Lesson, student_id: Optional[int]
) -> schemas.LessonDetail:
    exercises = (
        db.execute(
            select(models.Exercise)
            .where(models.Exercise.lesson_id == lesson.id)
            .order_by(models.Exercise.order_index, models.Exercise.id)
        )
        .scalars()
        .all()
    )

    exercise_ids = [exercise.id for exercise in exercises]

    tests_count: Dict[int, int] = {}
    if exercise_ids:
        test_rows = (
            db.execute(
                select(models.ExerciseTest.exercise_id, models.ExerciseTest.id).where(
                    models.ExerciseTest.exercise_id.in_(exercise_ids)
                )
            )
            .all()
        )
        for exercise_id, _ in test_rows:
            tests_count[exercise_id] = tests_count.get(exercise_id, 0) + 1

    exercise_progress_map: Dict[int, models.ExerciseProgress] = {}
    if exercise_ids and student_id is not None:
        exercise_progress_entries = (
            db.execute(
                select(models.ExerciseProgress).where(
                    and_(
                        models.ExerciseProgress.student_id == student_id,
                        models.ExerciseProgress.exercise_id.in_(exercise_ids),
                    )
                )
            )
            .scalars()
            .all()
        )
        exercise_progress_map = {entry.exercise_id: entry for entry in exercise_progress_entries}

    lesson_progress = None
    if student_id is not None:
        lesson_progress = (
            db.execute(
                select(models.LessonProgress).where(
                    and_(
                        models.LessonProgress.student_id == student_id,
                        models.LessonProgress.lesson_id == lesson.id,
                    )
                )
            )
            .scalar_one_or_none()
        )

    exercise_details: List[schemas.ExerciseDetail] = []
    for exercise in exercises:
        progress_entry = exercise_progress_map.get(exercise.id)
        exercise_details.append(
            schemas.ExerciseDetail(
                id=exercise.id,
                lesson_id=exercise.lesson_id,
                title=exercise.title,
                instructions=exercise.instructions,
                starter_code=exercise.starter_code or {},
                default_language=exercise.default_language,
                order_index=exercise.order_index,
                tests_count=tests_count.get(exercise.id, 0),
                progress=(
                    schemas.ExerciseProgressInfo(
                        status=progress_entry.status,
                        completed_at=progress_entry.completed_at,
                        last_run_output=progress_entry.last_run_output,
                        last_error=progress_entry.last_error,
                        last_language=progress_entry.last_language,
                    )
                    if progress_entry
                    else None
                ),
            )
        )

    return schemas.LessonDetail(
        id=lesson.id,
        course_id=lesson.course_id,
        title=lesson.title,
        description=lesson.description,
        video_url=lesson.video_url,
        notes=lesson.notes,
        order_index=lesson.order_index,
        progress=(
            schemas.LessonProgressInfo(
                completed=lesson_progress.completed,
                completed_at=lesson_progress.completed_at,
            )
            if lesson_progress
            else None
        ),
        exercises=exercise_details,
    )


def _build_course_summary(
    course: models.Course,
    lessons: List[schemas.LessonDetail],
) -> schemas.CourseProgressSummary:
    lessons_total = len(lessons)
    lessons_completed = sum(1 for lesson in lessons if lesson.progress and lesson.progress.completed)
    exercises = [exercise for lesson in lessons for exercise in lesson.exercises]
    exercises_total = len(exercises)
    exercises_completed = sum(
        1
        for exercise in exercises
        if exercise.progress and exercise.progress.status == "passed"
    )
    total = lessons_total + exercises_total
    completed = lessons_completed + exercises_completed
    status = "completed" if total and completed == total else "in_progress"
    return schemas.CourseProgressSummary(
        course=schemas.Course.model_validate(course),
        status=status,
        completion_percentage=(completed / total * 100) if total else 0.0,
        lessons_completed=lessons_completed,
        lessons_total=lessons_total,
        exercises_completed=exercises_completed,
        exercises_total=exercises_total,
    )
