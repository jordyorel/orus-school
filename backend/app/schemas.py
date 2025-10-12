from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

    model_config = ConfigDict(from_attributes=True)


class TokenData(BaseModel):
    user_id: int
    role: str

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    role: str

    model_config = ConfigDict(from_attributes=True)


class CourseBase(BaseModel):
    title: str
    description: str
    year: int
    order_index: int = 0


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    year: int | None = None
    order_index: int | None = None


class Course(CourseBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class TimestampedResponse(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class ProjectBase(BaseModel):
    title: str
    description: str


class ProjectCreate(ProjectBase):
    course_id: int
    github_link: Optional[str] = None


class ProjectSubmission(BaseModel):
    project_id: int
    github_link: str


class ProjectUpdate(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None
    github_link: Optional[str] = None
    score: Optional[int] = Field(None, ge=0, le=100)


class Project(ProjectBase):
    id: int
    course_id: int
    status: str
    github_link: Optional[str]
    feedback: Optional[str]
    student_id: int

    model_config = ConfigDict(from_attributes=True)


class Lesson(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    video_url: str
    notes: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class Exercise(BaseModel):
    id: int
    lesson_id: int
    title: str
    instructions: str
    starter_code: Dict[str, str]
    default_language: str
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class ExerciseTest(BaseModel):
    id: int
    exercise_id: int
    input_data: Optional[str]
    expected_output: str
    is_hidden: bool
    timeout: int

    model_config = ConfigDict(from_attributes=True)


class LessonProgress(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    completed: bool
    completed_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class ExerciseProgress(BaseModel):
    id: int
    student_id: int
    exercise_id: int
    status: str
    last_run_output: Optional[str]
    last_error: Optional[str]
    completed_at: Optional[datetime]
    last_language: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class LessonProgressRecord(BaseModel):
    lesson_id: int
    completed: bool
    completed_at: Optional[datetime]


class ExerciseProgressRecord(BaseModel):
    exercise_id: int
    status: str
    completed_at: Optional[datetime]
    last_language: Optional[str]


class CourseProgressSummary(BaseModel):
    course: Course
    status: str
    completion_percentage: float
    lessons_completed: int
    lessons_total: int
    exercises_completed: int
    exercises_total: int


class ProgressResponse(BaseModel):
    student: User
    courses: List[CourseProgressSummary]
    lesson_progress: List[LessonProgressRecord]
    exercise_progress: List[ExerciseProgressRecord]
    overall_completion_rate: float


class LessonProgressInfo(BaseModel):
    completed: bool
    completed_at: Optional[datetime]


class ExerciseProgressInfo(BaseModel):
    status: str
    completed_at: Optional[datetime]
    last_run_output: Optional[str]
    last_error: Optional[str]
    last_language: Optional[str]


class ExerciseDetail(BaseModel):
    id: int
    lesson_id: int
    title: str
    instructions: str
    starter_code: Dict[str, str]
    default_language: str
    order_index: int
    tests_count: int
    progress: Optional[ExerciseProgressInfo]


class LessonDetail(BaseModel):
    id: int
    course_id: int
    title: str
    description: str
    video_url: str
    notes: str
    order_index: int
    progress: Optional[LessonProgressInfo]
    exercises: List[ExerciseDetail]


class CourseLessonsResponse(BaseModel):
    course: Course
    lessons: List[LessonDetail]
    course_progress: CourseProgressSummary


class RunCodeRequest(BaseModel):
    language: str
    code: str
    stdin: Optional[str] = None


class RunCodeResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float


class RunTestsRequest(BaseModel):
    exercise_id: int
    language: str
    code: str


class TestCaseResult(BaseModel):
    test_id: int
    passed: bool
    stdout: str
    stderr: str
    expected_output: str
    input_data: Optional[str]


class RunTestsResponse(BaseModel):
    passed_all: bool
    results: List[TestCaseResult]


class MarkLessonCompleteRequest(BaseModel):
    lesson_id: int
