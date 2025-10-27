# 🧭 Phase 0 — Vision & Core Concept

My platform will be the **Orus School** — a modern coding education platform built around three pillars:

1. **Learning Hub** — structured lessons with videos, reading notes, and interactive exercises.
2. **Playground** — in-browser compiler and sandbox for real-time code execution.
3. **Progress System** — student dashboards, achievements, progress tracking, and admin control.

Think of it as a blend of:

> 🧱 **42 + Codewars **, simplified for my own school.

---

# 🧩 Phase 1 — High-Level Architecture

### 💻 Tech Stack

| Layer                | Technology                       | Description                                         |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| **Frontend**         | React + TypeScript + TailwindCSS | Modern UI, fast navigation, reactive state          |
| **Backend**          | FastAPI (Python)                 | Handles authentication, course data, code execution |
| **Database**         | SQLite / PostgreSQL              | Stores users, lessons, progress                     |
| **Compiler Sandbox** | GCC + Python runtime (local)      | Safe code execution for C, Python, etc.             |
| **Storage**          | Local `/videos` + optional S3    | Store video lessons and resources                   |
| **Auth**             | JWT                              | Secure login for students/admins                    |

---

# 🌐 Phase 2 — Site Structure Overview

Below is the full site map — every page and how they connect:

```
──────────────────────────────
🌍 PUBLIC AREA
──────────────────────────────
/landing            → Homepage + signup/login
/login              → Student login form
/register           → Student registration
/about              → Info about the school
/contact            → Contact form

──────────────────────────────
👨‍🎓 STUDENT AREA (protected)
──────────────────────────────
/dashboard          → Overview: progress, current course
/courses            → List of available courses
/course/:id         → Course details + lessons list
/lesson/:id         → Lesson player (video + notes + exercise + code editor)
/playground         → Standalone code playground
/profile            → Student info + achievements
/settings           → Theme, password, etc.

──────────────────────────────
🧑‍🏫 ADMIN AREA (protected)
──────────────────────────────
/admin              → Admin dashboard
/admin/courses      → Manage courses (CRUD)
/admin/lessons      → Manage lessons (CRUD)
/admin/upload-video → Upload video files
/admin/users        → Manage students
```

---

# 🎨 Phase 3 — Page-by-Page Breakdown (Frontend + Behavior)

---

## **1. Landing Page (`/landing`)**

### Purpose

Introduce the platform, explain the learning model, and encourage sign-up.

### Sections

* Hero banner (Orus School tagline + “Start Learning” button)
* Video preview or animation
* “How it works” (Learn → Practice → Grow)
* Testimonials / features grid
* Footer (contact, links)

┌──────────────────────────────────────────────────────────────────────────┐
│ [ ORUS SCHOOL LOGO (button) ]           [ Sign In ] [ Get Started ]      │
│──────────────────────────────────────────────────────────────────────────│
│                                                                          │
│      🚀 Learn to Think, Code, and Build Like a Software Engineer.         │
│                                                                          │
│  Master C, algorithms, and software engineering through hands-on coding, │
│  guided projects, and Orus-powered challenges.                           │
│                                                                          │
│  [ Start Learning ]   [ Explore Curriculum ]                             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                            🧠 What You’ll Learn                           │
│                                                                          │
│  [ 💻 Programming in C ] [ 🧮 Algorithms & Data Structures ]              │
│  [ 🧩 Problem Solving Skills ] [ 🏗️ Software Engineering Foundations ]    │
│  [ ⚙️ Memory & Systems ] [ 🤖 Logic & Analytical Thinking ]               │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                        🎯 Why Orus School Is Different                    │
│                                                                          │
│  ┌──────────────────────┬────────────────────────┬──────────────────────┐ │
│  │ 🧩 Interactive Editor │ 📹 Guided Video Lessons │ 🧠 Project-Based Learning │ │
│  │ Code directly online │ Learn at your pace     │ Build real solutions     │ │
│  ├──────────────────────┼────────────────────────┼──────────────────────┤ │
│  │ 🧪 Auto-Graded Tests  │ 🕹️ Live Feedback       │ 📈 Progress Tracking     │ │
│  │ Instant evaluation   │ See your errors live   │ Unlock next levels      │ │
│  └──────────────────────┴────────────────────────┴──────────────────────┘ │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                           🧭 Year 1 Curriculum                            │
│                                                                          │
│  • C Basics — Syntax, Loops, and Functions                               │
│  • Shell & Git — Command Line and Version Control                        │
│  • Memory & Pointers — Deep Understanding of How Computers Work          │
│  • Algorithms — Sorting, Searching, and Logic                            │
│  • Problem Solving Bootcamp — Challenges & Competitions                  │
│  • Software Engineering — Clean Code, Architecture, Collaboration        │
│  • Final Project — Build a Mini Compiler or Library (libft)              │
│                                                                          │
│  [ View Curriculum ]                                                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                          💡 How Learning Works                            │
│                                                                          │
│  1️⃣ Watch or read lessons (video + notes)                               │
│  2️⃣ Practice directly in the playground                                 │
│  3️⃣ Solve real challenges                                               │
│  4️⃣ Get instant feedback                                                │
│  5️⃣ Unlock the next concept                                            │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                    🌟 From Beginner to Engineer                           │
│                                                                          │
│  Orus School doesn’t just teach you how to code. It trains you to think, │
│  debug, and build like a software engineer — mastering logic, design,    │
│  and resilience.                                                         │
│                                                                          │
│  💬 “We don’t memorize syntax. We solve problems.”                       │
│                                                                          │
│  [ Join the Beta ] [ Log In ]                                            │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  © 2025 Orus School — Built with ❤️ in Congo. [About] [Contact] [Terms]  │
└──────────────────────────────────────────────────────────────────────────┘


---

## **2. Login / Register**

### Features

* Login with email + password
* JWT stored in localStorage
* “Forgot password?” (later)
* Auto-redirect to dashboard


# 🔐 **ORUS SCHOOL — LOGIN PAGE SPECIFICATION**

## 🎨 **Visual Identity**

* **Theme:** Dark (matches the rest of Orus School)
* **Mood:** Calm, focused, “engineering console” aesthetic
* **Font:** `Inter` / `Satoshi`
* **Accent color:** `#1E90FF` (Orus Blue)
* **Background:** `linear-gradient(to bottom right, #0D1117, #010409)`
* **Style:** Centered panel, soft glow, VSCode login feel

---

## 🧱 **PAGE STRUCTURE**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [ Orus School Logo ]                                                      │
│────────────────────────────────────────────────────────────────────────────│
│                                                                            │
│     🔐 Sign In to Continue Your Learning                                   │
│                                                                            │
│     [ Email Address __________________________ ]                           │
│     [ Password _______________________________ ]                           │
│                                                                            │
│     [ ☐ Remember Me ]               [ Forgot Password? ]                   │
│                                                                            │
│     [ 🔵 Log In ]                                                         │
│                                                                            │
│     ───────────── or ─────────────                                          │
│                                                                            │
│     New here? [ Create an Account ]                                        │
│                                                                            │
│────────────────────────────────────────────────────────────────────────────│
│  © 2025 Orus School. Built with ❤️ in Congo.                              │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 **PAGE CONTENT (Detailed)**

### 🔹 Header

* Minimal **Orus School logo** (top center or left corner)
* Optional: small subtext →
  *"Your journey to becoming a software engineer starts here."*

---

### 🔹 Main Card (Centered Panel)

A floating card in the center of the screen.

**Card style:**

* `bg-[#0F172A]` (dark navy)
* `border border-gray-800`
* `rounded-2xl`
* `shadow-lg shadow-blue-900/30`
* `p-8` with vertical layout

**Inside:**

* Title:

  > “Welcome back 👋”
* Subtitle:

  > “Log in to continue your progress.”

---

### 🔹 Form Fields

| Field               | Type       | Notes                            |
| ------------------- | ---------- | -------------------------------- |
| **Email**           | text/email | Must validate format             |
| **Password**        | password   | With toggle visibility icon      |
| **Remember Me**     | checkbox   | Stored locally (optional)        |
| **Forgot Password** | link       | Leads to `/auth/forgot` (future) |

---

### 🔹 Buttons

| Button                                          | Description                                  |
| ----------------------------------------------- | -------------------------------------------- |
| **🔵 Log In**                                   | Primary CTA; full width; glows blue on hover |
| **⚪ Create an Account**                         | Text link; smaller font; no border           |
| **Optional:** Login with GitHub/Google (future) | Small secondary buttons                      |

---

### 🔹 Footer

> “© 2025 Orus School — Built with ❤️ in Congo.”

Small, centered, muted gray text (`text-gray-500 text-xs`).

---

## 🧭 **INTERACTIONS**

| Event                | Behavior                                         |
| -------------------- | ------------------------------------------------ |
| ✅ Successful login   | Redirects to `/dashboard`                        |
| ❌ Failed login       | Red error alert under password                   |
| ⏳ Loading            | Button changes to `[ Logging in… ]` with spinner |
| 🌙 Dark Mode         | Default                                          |
| ⌨️ Keyboard Shortcut | Press `Enter` to submit                          |

---

## 🧩 **SIGN UP PAGE VARIANT**

Same layout — slightly modified content:

### Title

> “Create your Orus School Account”

### Subtitle

> “Start coding, learning, and building your future.”

### Fields

| Field            | Type     |
| ---------------- | -------- |
| Name             | text     |
| Email            | email    |
| Password         | password |
| Confirm Password | password |

### Button

> [ Create Account ] (Primary blue button)

### Bottom Text

> Already have an account? [ Log In ]

---

## ⚙️ **BACKEND API EXPECTATIONS**

| Endpoint             | Method | Description                         |
| -------------------- | ------ | ----------------------------------- |
| `/api/auth/login`    | POST   | Accepts `{ email, password }`       |
| `/api/auth/register` | POST   | Accepts `{ name, email, password }` |
| `/api/auth/me`       | GET    | Returns logged-in user              |
| `/api/auth/logout`   | POST   | Ends session                        |
| `/api/auth/forgot`   | POST   | Sends reset email (optional)        |

---

## 🧠 **ADDITIONAL TOUCHES**

* Small glowing **cursor animation** in input fields
* Password field icon (eye) to toggle visibility
* Gentle “shake” animation if login fails
* Background accent animation: faint floating code snippets (optional)

---

## ✨ **Example Tagline (Top of Login Page)**

> “Every engineer starts somewhere. Start here.”

or

> “Welcome back — let’s build something new today.”


---

## **3. Dashboard (`/dashboard`)**

### Layout

* Welcome message
* Global progress bar
* Current course shortcut
* Announcements panel
* Achievements (badges)
* “Continue Learning” button

### Backend endpoints

* `GET /me` → student info
* `GET /progress` → progress summary
* `GET /announcements`

---

## **4. Courses List (`/courses`)**

### View

Grid of all available courses:

```
[C Programming Fundamentals]
[Algorithms I]
[Shell & Git]
[Networking Basics]
```

Click → `/course/:id`

### API

* `GET /courses`
* Each course includes title, description, progress, locked/unlocked status.

---

## **5. Course Detail (`/course/:id`)**

### Layout

Left: course overview + lesson list
Right: preview or “Start Course” button

### API

* `GET /courses/:id` → lessons list, description, progress

---

## **6. Lesson Player (`/lesson/:id`)**

### Design (Core Page)

👉 **This is the heart of the platform — inspired by Codewars & AlgoExpert**

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ORUS School                                    |   Language: C/python     |   Avatar (●)│
├────────────────────────────────────────────────┴────────────────────────────────────────┤
│                                VERTICAL DIVIDER (fixed / resizable)                     │
│                                            |                                            │
│  LEFT PANE (Lesson)                        │  RIGHT PANE (Playground)                  │
│────────────────────────────────────────────┼───────────────────────────────────────────│
│ Tabs: [ Course ] [ Video ] [ exercise ]    │  ┌───────────────────────────────────────┐ │
│────────────────────────────────────────────│  │                            [ Run ▶ ]  │
│ Active Tab (Markdown or Video)             │  └───────────────────────────────────────┘ │
│  • Text/course area is scrollable         │  Monaco Editor (VS Code dark theme)        │
│  • Does NOT affect right pane              │  • Full height                             │
│                                            │  • Autosave                                │
│────────────────────────────────────────────┼───────────────────────────────────────────│
│ 🧪 Test Panel (READ-ONLY)                  │  💻 Output Console (stdout / stderr)       │
│  • Sample tests / expected output          │  • Sticky auto-scroll                      │
│  • Always visible at the bottom            │  • Independent from left pane               │
│─────────────────────────────────────────────┼────────────────────────────────────────────│
│                           [ Next Lesson → ] │                   [ 🧪 Test ][ ✅ Submit ]  │
└─────────────────────────────────────────────┴────────────────────────────────────────────┘

```

### Behavior

* Switch tabs without reloading page
* Runs code via `/api/run`
* When all tests pass → mark lesson complete (`POST /api/progress`)
* "Next Lesson" loads dynamically (no full reload)

### APIs

* `GET /lesson/:id`
* `POST /run` (execute code)
* `POST /progress/complete/:lesson_id`

---

## **7. Playground (`/playground`)**

Standalone page for experimenting with code.

### Features

* Language dropdown (C, Python, JS)
* Monaco Editor
* Run button → `/api/run`
* Output console
* Reset button (clear code)

---

## **8. Profile (`/profile`)**

Displays student stats.

### Fields

* Name, email
* Courses completed
* Lessons done
* Achievements
* “Edit profile” button

---

## **9. Admin Dashboard (`/admin`)**

### Sections

* Quick overview (total users, lessons, videos)
* Buttons to manage:

  * Courses
  * Lessons
  * Users
  * Uploads

---

## **10. Admin: Courses Management**

### Features

* Add / edit / delete courses
* Reorder courses
* Each course → description, year, order, visibility

---

## **11. Admin: Lessons Management**

### Features

* Create lessons (title, course, notes, exercise, code)
* Upload video file
* Preview button
* Markdown editor for notes
* Reorder lessons

### API

* `POST /admin/lesson`
* `PUT /admin/lesson/:id`
* `DELETE /admin/lesson/:id`

---

## **12. Admin: Video Uploads**

### Features

* Upload mp4 (local)
* Auto-save to `/videos` folder
* Displays video URL to attach to lesson

---

# 🧮 Phase 4 — Database Schema (Full)

| Table                 | Fields                                                                | Description              |
| --------------------- | --------------------------------------------------------------------- | ------------------------ |
| **users**             | id, name, email, password_hash, role(`student`/`admin`), created_at   | Auth & profile           |
| **courses**           | id, title, description, order, is_published                           | Course info              |
| **lessons**           | id, title, notes, exercise, starter_code, video_url, course_id, order | Lesson details           |
| **progress**          | id, user_id, lesson_id, is_completed, score, updated_at               | Track student’s progress |
| **announcements**     | id, title, message, created_at                                        | News for dashboard       |
| **submissions**       | id, user_id, lesson_id, code, result, passed, created_at              | Code attempts            |
| **achievements**      | id, title, icon, condition                                            | Unlockable goals         |
| **user_achievements** | id, user_id, achievement_id, unlocked_at                              | Tracking achievements    |

---

# ⚙️ Phase 5 — Backend Endpoints Summary

| Endpoint                        | Method | Purpose              |
| ------------------------------- | ------ | -------------------- |
| `/auth/login`                   | POST   | Authenticate user    |
| `/auth/register`                | POST   | Register student     |
| `/auth/me`                      | GET    | Get user profile     |
| `/courses`                      | GET    | List courses         |
| `/courses/:id`                  | GET    | Course details       |
| `/lesson/:id`                   | GET    | Lesson details       |
| `/progress/:user_id`            | GET    | Get student progress |
| `/progress/complete/:lesson_id` | POST   | Mark lesson complete |
| `/api/run`                      | POST   | Compile & run code   |
| `/admin/lesson`                 | POST   | Create new lesson    |
| `/admin/course`                 | POST   | Create new course    |
| `/videos/{file}`                | GET    | Serve uploaded video |
| `/announcements`                | GET    | Dashboard news       |

---

# 🧠 Phase 6 — Interaction Flow

1. **Student logs in → Dashboard**

   * Fetch `/me` + `/progress`
   * Show “Continue Learning” button

2. **Clicks Course → Lessons list**

   * API: `/courses/:id`

3. **Clicks Lesson → Lesson Player**

   * Loads video, notes, exercise, starter code
   * Editor connected to `/api/run`
   * On test success → mark complete `/progress/complete`

4. **Next Lesson → same page, next lesson ID**

   * Re-fetches lesson data
   * Editor + test area reset

5. **Admin adds new lesson**

   * Form → uploads video + notes
   * Lesson appears instantly for students

---

# 🧱 Phase 7 — Design Principles (Visual/UI)

| Area           | Design Style                                              |
| -------------- | --------------------------------------------------------- |
| **Theme**      | Dark mode default, minimalist (black, blue, gray)         |
| **Layout**     | Fixed top bar, draggable split between left tabs & editor |
| **Typography** | Inter or JetBrains Mono for code                          |
| **Animations** | Subtle fade transitions between lessons                   |
| **Icons**      | lucide-react or Heroicons                                 |
| **Editor**     | Monaco dark theme, smooth autosave                        |
| **Console**    | Collapsible + color-coded output                          |
| **Progress**   | Animated progress bar per course                          |

---

# 🚀 Phase 8 — Milestones (Development Roadmap)

| Stage                         | Deliverable                            |
| ----------------------------- | -------------------------------------- |
| **1. Scaffold project**       | FastAPI backend + React frontend setup |
| **2. Auth system**            | JWT login/register                     |
| **3. Admin panel**            | CRUD courses/lessons + upload videos   |
| **4. Student UI**             | Dashboard + course/lesson pages        |
| **5. Playground integration** | Monaco + `/run` GCC execution          |
| **6. Progress tracking**      | Lessons mark as completed              |
| **7. UI polish**              | Tabs, draggable panels, dark theme     |
| **8. Deploy**                 | Manual deploy to VPS (systemd/gunicorn)|
| **9. (Optional)**             | Add cloud video hosting + analytics    |

---

# ✅ End Result

You’ll have a **self-contained modern coding school platform**:

* Admin uploads courses and videos
* Students learn with interactive lessons
* Real C/Python code execution
* Clean progress tracking and dashboard
* 42-like independence + AlgoExpert polish + Codewars energy
