# Orus School Platform Specification

This document outlines the target experience for a fast prototype of the Orus School platform that can be generated with tools such as ChatGPT, GitHub Copilot, v0, or similar.

## 1. Goal

Create a modern web platform where:

* Students authenticate, review their curriculum, track course progress, and submit project deliverables.
* Administrators manage the curriculum, monitor learner progress, and provide feedback on submissions.
* The programme spans **Year 1** (Foundations) and **Year 2** (Advanced), each containing multiple modules and associated projects.

## 2. Architecture Overview

* **Backend**: [FastAPI](https://fastapi.tiangolo.com/) providing REST endpoints for authentication, curriculum management, project submissions, and progress tracking. Utilise role-based access control for students and admins, and persist data in PostgreSQL (or SQLite during prototyping).
* **Frontend**: [React](https://react.dev/) with [Tailwind CSS](https://tailwindcss.com/) delivering a responsive single-page application that consumes the FastAPI endpoints. Use React Router for navigation between dashboard, course, and admin views.
* **Database Schema (MVP)**:
  * `User(id, name, email, password_hash, role[student|admin])`
  * `Course(id, title, description, year, order_index)`
  * `Project(id, course_id, title, description, status, github_link, feedback, student_id)`
  * `Progress(id, student_id, course_id, completed, score)`

## 3. Backend Requirements

### Authentication

* `POST /auth/register` – Register a new student account.
* `POST /auth/login` – Authenticate user credentials and return a JWT.

### Course Management

* `GET /courses` – List all courses, optionally filtered by academic year.
* `POST /courses` – Admin-only endpoint to add a course or module.

### Project Management

* `GET /projects?student_id=` – Retrieve the authenticated student's project records.
* `POST /projects/submit` – Submit a project artefact (GitHub URL or uploaded file reference).
* `PATCH /projects/{id}` – Admin updates status and feedback for a project submission.

### Progress Tracking

* `GET /progress/{student_id}` – Fetch a student's progress across courses.
* Automatically update progress when a project is marked as complete, adjusting completion percentage and unlocking dependent modules.

## 4. Frontend Experience

### Authentication Views

* **Login / Register**: Minimalist forms featuring the school branding, email/password fields, and password confirmation on registration.

### Student Dashboard

* Header greeting (e.g., “Welcome, Alice”).
* Global progress indicator displaying overall completion percentage.
* Two curriculum sections:
  * **Year 1 – Foundations**: Grid of course cards with quick status cues.
  * **Year 2 – Advanced & Tracks**: Locked until Year 1 is complete.
* **Course Card** elements: title, concise description, status label (“Not Started”, “In Progress”, “Completed”), CTA to view associated projects.

### Course & Project Detail

* Detailed project brief including objectives and submission requirements.
* Submission form capturing GitHub repository link (or future file upload).
* Status indicator (Submitted, Pending Review, Completed) and admin feedback panel.

### Admin Dashboard

* Overview table of students with progress percentages.
* Workflow for reviewing submissions and toggling project status/feedback.
* Interfaces for creating or editing courses and projects.

## 5. UI Style Guide

* Design with Tailwind CSS utility classes for rapid theming and responsive layouts.
* Employ a clean card-based layout with subtle shadows; colour cues for status (green = completed, yellow = in progress, grey = locked).
* Ensure mobile responsiveness via stacked layouts and accessible touch targets.

## 6. Example User Flow

1. Student registers and logs in.
2. Dashboard lists Year 1 modules such as “C Basics”, “Shell & Git”, “Memory & I/O”.
3. Student opens **C Basics**, reviews the “libft” project, and submits a GitHub link.
4. Admin reviews the submission, marks it as “Passed”, and leaves feedback.
5. Student sees updated feedback, progress increases, and subsequent modules unlock.

## 7. Prototype Scope

For an initial prototype deliverable:

* Implement login/register, student dashboard, course detail, and project submission screens in React.
* Provide FastAPI endpoints for authentication, courses, projects, and progress queries.
* Use SQLite for quick persistence during development (swap to PostgreSQL in production).

## 8. Stretch Enhancements

* Peer review capabilities for collaborative feedback.
* Announcement feed surfaced on the dashboard.
* Gamification features such as badges or milestones.
* Rich file uploads alongside GitHub links.
* Embedded video lectures via YouTube or Vimeo.


---

# 🛠️ Running the Prototype

This repository now ships with a working FastAPI backend and a Vite + React (Tailwind CSS) frontend implementing the features described above.

## Backend

The backend lives in the `backend/` directory, but thanks to the lightweight
`app/` compatibility package you can start the API from the repository root.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload
```

If you prefer to keep virtual environments scoped to the backend folder, the
following commands are equivalent:

```bash
cd backend
python -m venv .venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API defaults to SQLite storage (`backend/data/orus_school.db`). The directory
is created automatically so the database file lives alongside your checkout even
when the backend runs inside Docker. Set `DATABASE_URL` to point to PostgreSQL or
another database if required, or `SQLITE_PATH` to override the SQLite file
location.

### Docker

The backend can also be packaged with Docker. Build the image from the repository root:

```bash
docker build -t orus-backend backend
```

Then run the container, exposing port 8000 locally. Mount the `backend/data`
directory so that the SQLite database persists on your machine:

```bash
docker run -p 8000:8000 -v "$(pwd)/backend/data:/app/data" orus-backend
```

> **Want to use your local SQLite file by default?**
> 
> The backend automatically falls back to `backend/data/orus_school.db` when
> `DATABASE_URL` is unset. If you previously pointed the app at a Dockerized
> database, simply remove the `DATABASE_URL` environment variable (or set it to
> an empty string) before starting the server:
> 
> ```bash
> # macOS / Linux shells
> unset DATABASE_URL
> uvicorn app.main:app --reload
> 
> # PowerShell
> Remove-Item Env:DATABASE_URL
> uvicorn app.main:app --reload
> ```
> 
> When running with Docker, keep the `-v "$(pwd)/backend/data:/app/data"` mount
> so the container still writes to the same SQLite file on your host machine.

The container image uses `build-essential` so the embedded compiler toolchain is available during dependency installation.

Once the container is up, the FastAPI app will already be serving requests at
`http://localhost:8000` using the default `uvicorn app.main:app` command defined
in the Dockerfile. You can confirm everything worked by visiting the automatic
interactive docs at `http://localhost:8000/docs` or hitting the health endpoint
with `curl`:

```bash
curl http://localhost:8000/docs
```

### Creating an admin user

```bash
python -m app.scripts.create_admin
```

You will be prompted for name, email, and password. The script seeds an administrator account capable of creating courses and reviewing projects.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Once Vite prints the local development URL (usually `http://localhost:5173`),
open the `/playground` route in your browser to load the demo coding workspace
without authenticating. Click **Run Code** on the warm-up exercise to simulate a
compiler run and confirm that "Hello world" now appears in the Custom Output tab.

The Vite dev server proxies API requests to `http://localhost:8000` (configured in `vite.config.ts`).

## Sample workflow

1. Start the backend and frontend servers.
2. Create an admin user (see script above) and sign in via `/login`.
3. Add courses from the admin dashboard.
4. Register a student account from the login screen.
5. As the student, submit projects for courses and track progress from the dashboard.
6. Switch to the admin account to review submissions, provide feedback, and mark them completed – progress will update automatically on the student dashboard.
