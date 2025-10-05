from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text
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


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    year = Column(Integer, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)

    projects = relationship("Project", back_populates="course", cascade="all, delete-orphan")
    progress_entries = relationship("Progress", back_populates="course", cascade="all, delete-orphan")


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
