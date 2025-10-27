import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.db import Base, engine
    from backend.routers import auth, profile
except ModuleNotFoundError as exc:
    if exc.name.startswith("backend"):
        sys.path.append(str(Path(__file__).resolve().parent.parent))
        from backend.db import Base, engine
        from backend.routers import auth, profile
    else:
        raise

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Orus School API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)


@app.get("/")
def read_root():
    return {"status": "ok"}
