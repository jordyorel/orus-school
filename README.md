# Orus School Platform Specification

This document outlines the target experience for a fast prototype of the Orus School platform that can be generated with tools such as ChatGPT, GitHub Copilot, v0, or similar.


# 🛠️ Running the Prototype

## Backend

The backend lives in the `backend/` directory, but thanks to the lightweight
`app/` compatibility package you can start the API from the repository root.


```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```


### Docker

The backend can also be packaged with Docker. Build the image from the repository root:

```bash
docker build -t orus-backend backend
```

```bash
docker run -p 8000:8000 -v "$(pwd)/backend/data:/app/data" orus-backend
```

> **We need to use your local SQLite/Postgres db as primary DB not docker**

```bash
curl http://localhost:8000/docs
```

### Creating an admin user

```bash
python -m app.scripts.create_admin
```


## Frontend

```bash
cd frontend
npm install
npm run dev
```
