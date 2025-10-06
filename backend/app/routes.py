from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
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

