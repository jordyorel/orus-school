from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")

    projects = relationship("Project", back_populates="student", cascade="all, delete-orphan")
    progress_entries = relationship("Progress", back_populates="student", cascade="all, delete-orphan")
    lesson_progress_entries = relationship(
        "LessonProgress", back_populates="student", cascade="all, delete-orphan"
    )
    exercise_progress_entries = relationship(
        "ExerciseProgress", back_populates="student", cascade="all, delete-orphan"
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    year = Column(Integer, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)

    projects = relationship("Project", back_populates="course", cascade="all, delete-orphan")
    progress_entries = relationship("Progress", back_populates="course", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    github_link = Column(String(255), nullable=True)
    feedback = Column(Text, nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    course = relationship("Course", back_populates="projects")
    student = relationship("User", back_populates="projects")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    completed = Column(Boolean, default=False)
    score = Column(Integer, nullable=True)

    student = relationship("User", back_populates="progress_entries")
    course = relationship("Course", back_populates="progress_entries")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    video_url = Column(String(500), nullable=False)
    notes = Column(Text, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)

    course = relationship("Course", back_populates="lessons")
    exercises = relationship("Exercise", back_populates="lesson", cascade="all, delete-orphan")
    progress_entries = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    starter_code = Column(JSON, nullable=False, default=dict)
    default_language = Column(String(50), nullable=False, default="python")
    order_index = Column(Integer, nullable=False, default=0)

    lesson = relationship("Lesson", back_populates="exercises")
    tests = relationship("ExerciseTest", back_populates="exercise", cascade="all, delete-orphan")
    progress_entries = relationship("ExerciseProgress", back_populates="exercise", cascade="all, delete-orphan")


class ExerciseTest(Base):
    __tablename__ = "exercise_tests"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    input_data = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=True)
    timeout = Column(Integer, nullable=False, default=5)

    exercise = relationship("Exercise", back_populates="tests")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("User", back_populates="lesson_progress_entries")
    lesson = relationship("Lesson", back_populates="progress_entries")


class ExerciseProgress(Base):
    __tablename__ = "exercise_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    last_run_output = Column(Text, nullable=True)
    last_error = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    last_language = Column(String(50), nullable=True)

    student = relationship("User", back_populates="exercise_progress_entries")
    exercise = relationship("Exercise", back_populates="progress_entries")
