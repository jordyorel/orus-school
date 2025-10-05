from datetime import datetime
from typing import List, Optional

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


class Course(CourseBase):
    id: int

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


class Progress(BaseModel):
    id: int
    student_id: int
    course_id: int
    completed: bool
    score: Optional[int]

    model_config = ConfigDict(from_attributes=True)


class ProgressResponse(BaseModel):
    student: User
    courses: List[Course]
    progress: List[Progress]
    completion_rate: float

    model_config = ConfigDict(from_attributes=True)


class TimestampedResponse(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)
