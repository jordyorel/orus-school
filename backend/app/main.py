from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import (
    auth_router,
    admin_router,
    course_router,
    execution_router,
    learning_router,
    lesson_router,
    progress_router,
    project_router,
    user_router,
    video_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Orus School API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers both at the root (legacy behaviour expected by existing
# clients and tests) and under an ``/api`` prefix so that deployments behind
# simple reverse proxies – such as Docker setups serving the frontend at the
# domain root – can still reach the backend without additional rewrites. The
# prefixed routes are hidden from the OpenAPI schema to avoid duplicate
# documentation entries.
_ROUTERS = [
    auth_router,
    course_router,
    lesson_router,
    project_router,
    progress_router,
    user_router,
    execution_router,
    learning_router,
    admin_router,
    video_router,
]

for router in _ROUTERS:
    app.include_router(router)
    app.include_router(router, prefix="/api", include_in_schema=False)


@app.get("/health")
def health_check():
    return {"status": "ok"}
