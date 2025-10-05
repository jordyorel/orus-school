from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import auth_router, course_router, progress_router, project_router, user_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Orus School API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(course_router)
app.include_router(project_router)
app.include_router(progress_router)
app.include_router(user_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
