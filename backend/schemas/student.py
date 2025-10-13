from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class StudentBase(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    avatar_url: Optional[str] = None


class StudentCreate(StudentBase):
    password: str = Field(..., min_length=8)


class StudentRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    avatar_url: Optional[str] = None

    model_config = {
        "from_attributes": True,
    }


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
