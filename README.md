# Orus School Platform Specification

This document outlines the target experience for a fast prototype of the Orus School platform that can be generated with tools such as ChatGPT, GitHub Copilot, v0, or similar.


# 🛠️ Running the Prototype

## Backend

The backend lives in the `backend/` directory and exposes the FastAPI service
that powers authentication and the student profile endpoints.

### 1. Install dependencies & start the server

From the repository root:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate  # Windows: backend\venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --app-dir backend
```

The API is now available at `http://localhost:8000`. Interactive docs are
served at `http://localhost:8000/docs` where you can explore and test each
endpoint. Data persists in the bundled SQLite database at
`backend/students.db`, so no Docker setup is required.

### 2. Register and authenticate a student

You can register a new student directly from the docs UI or with `curl`:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Ada Lovelace", "email": "ada@example.com", "password": "change-me"}'
```

Login to retrieve a JWT access token:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ada@example.com&password=change-me"
```

The response contains the `access_token`. Use it to access protected routes,
such as the profile endpoint:

```bash
curl http://localhost:8000/profile/me \
  -H "Authorization: Bearer <access_token>"
```

## Frontend

The React application lives under `frontend/` and communicates with the
backend to manage login state and display the student profile.

### 1. Install dependencies & run the dev server

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server prints the local URL (typically `http://localhost:5173`).

### 2. Interact with the app

1. Open the dev server URL in your browser.
2. Use the **Register** page to create a student account or the **Login** page
   if you already registered via the API.
3. After logging in the UI stores the JWT token, fetches `/profile/me`, and
   renders the student profile. The navigation bar exposes a **Logout** button
   that clears the session.

Changes are hot-reloaded while the dev server is running. Stop it with
`Ctrl+C` when you are done.
