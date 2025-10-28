import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const COURSE_STORAGE_KEY = "orus:admin:courses";
const LESSON_STORAGE_KEY = "orus:admin:lessons";

type CourseFormState = {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  duration: string;
  level: string;
  pace: string;
  prerequisites: string;
  outcomes: string;
  practices: string;
  projects: string;
};

type LessonFormState = {
  courseSlug: string;
  lessonId: string;
  title: string;
  summary: string;
  videoUrl: string;
  intro: string;
  duration: string;
};

type DraftCoursePayload = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  level: string;
  pace: string;
  prerequisites: string[];
  outcomes: string[];
  practices: string[];
  projects: string[];
};

type DraftLessonPayload = {
  courseSlug: string;
  lessonId: string;
  title: string;
  summary: string;
  duration: string;
  videoUrl: string;
  intro: string;
};

const parseMultiline = (value: string): string[] =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const emptyCourseForm: CourseFormState = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  duration: "",
  level: "",
  pace: "",
  prerequisites: "",
  outcomes: "",
  practices: "",
  projects: "",
};

const emptyLessonForm: LessonFormState = {
  courseSlug: "",
  lessonId: "",
  title: "",
  summary: "",
  videoUrl: "",
  intro: "",
  duration: "",
};

const safeReadLocalStorage = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const AdminPage = () => {
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm);
  const [lessonForm, setLessonForm] = useState<LessonFormState>(emptyLessonForm);
  const [draftCourses, setDraftCourses] = useState<DraftCoursePayload[]>(() => safeReadLocalStorage<DraftCoursePayload>(COURSE_STORAGE_KEY));
  const [draftLessons, setDraftLessons] = useState<DraftLessonPayload[]>(() => safeReadLocalStorage<DraftLessonPayload>(LESSON_STORAGE_KEY));
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(draftCourses));
  }, [draftCourses]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LESSON_STORAGE_KEY, JSON.stringify(draftLessons));
  }, [draftLessons]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const coursePreview = useMemo<DraftCoursePayload>(() => ({
    slug: courseForm.slug.trim(),
    title: courseForm.title.trim(),
    tagline: courseForm.tagline.trim(),
    description: courseForm.description.trim(),
    duration: courseForm.duration.trim(),
    level: courseForm.level.trim(),
    pace: courseForm.pace.trim(),
    prerequisites: parseMultiline(courseForm.prerequisites),
    outcomes: parseMultiline(courseForm.outcomes),
    practices: parseMultiline(courseForm.practices),
    projects: parseMultiline(courseForm.projects),
  }), [courseForm]);

  const lessonPreview = useMemo<DraftLessonPayload>(() => ({
    courseSlug: lessonForm.courseSlug.trim(),
    lessonId: lessonForm.lessonId.trim(),
    title: lessonForm.title.trim(),
    summary: lessonForm.summary.trim(),
    duration: lessonForm.duration.trim(),
    videoUrl: lessonForm.videoUrl.trim(),
    intro: lessonForm.intro.trim(),
  }), [lessonForm]);

  const handleCourseSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coursePreview.slug || !coursePreview.title) {
      setFeedback("Course title and slug are required.");
      return;
    }
    setDraftCourses((prev) => [...prev, coursePreview]);
    setCourseForm(emptyCourseForm);
    setFeedback("Course draft saved locally.");
  };

  const handleLessonSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lessonPreview.courseSlug || !lessonPreview.lessonId || !lessonPreview.title) {
      setFeedback("Lesson course slug, id, and title are required.");
      return;
    }
    setDraftLessons((prev) => [...prev, lessonPreview]);
    setLessonForm(emptyLessonForm);
    setFeedback("Lesson draft saved locally.");
  };

  const handleCopy = (payload: unknown) => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      setFeedback("Clipboard API unavailable in this environment.");
      return;
    }
    navigator.clipboard
      .writeText(JSON.stringify(payload, null, 2))
      .then(() => setFeedback("Copied draft to clipboard."))
      .catch(() => setFeedback("Failed to copy to clipboard."));
  };

  const handleDeleteCourse = (index: number) => {
    setDraftCourses((prev) => prev.filter((_, idx) => idx !== index));
    setFeedback("Removed course draft.");
  };

  const handleDeleteLesson = (index: number) => {
    setDraftLessons((prev) => prev.filter((_, idx) => idx !== index));
    setFeedback("Removed lesson draft.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-editor-deep via-editor-panel to-editor-surface text-gray-100">
      <div className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-electric/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cw-accent/10 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-10">
        <header className="flex flex-wrap items-start justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-8 backdrop-blur-xl shadow-lg shadow-black/30">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-electric/30 bg-electric/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-electric-light">
              Admin Ops
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Manual Course & Lesson Staging</h1>
            <p className="text-sm leading-relaxed text-gray-200">
              Use these forms to stage new curriculum entries, upload lesson metadata, and prepare JSON snippets ready for the
              codebase or backend. Drafts stay in your browser storage until you clear them.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 text-xs text-gray-400">
            <Link
              to="/course/c-foundations"
              className="inline-flex items-center gap-2 rounded-full border border-electric/40 bg-electric/10 px-4 py-2 font-semibold text-electric-light transition hover:border-electric hover:text-electric"
            >
              Back to Courses
            </Link>
            {feedback && (
              <div className="w-60 rounded-full border border-electric/40 bg-electric/10 px-4 py-2 text-center text-[11px] font-medium text-electric-light shadow">{feedback}</div>
            )}
          </div>
        </header>

        <section className="mt-12 grid gap-10 xl:grid-cols-[1.2fr_1fr]">
          <form
            onSubmit={handleCourseSubmit}
            className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-editor-panel/70 p-8 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Course Builder</p>
                <h2 className="text-xl font-semibold text-white">Create a course shell</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCourseForm(emptyCourseForm);
                  setFeedback("Course form cleared.");
                }}
                className="text-xs text-gray-400 transition hover:text-white"
              >
                Reset form
              </button>
            </div>
            <div className="grid gap-4">
              <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                Title
                <input
                  required
                  value={courseForm.title}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                Slug
                <input
                  required
                  value={courseForm.slug}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="c-foundations"
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                Tagline
                <input
                  value={courseForm.tagline}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, tagline: event.target.value }))}
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                Description
                <textarea
                  value={courseForm.description}
                  onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { key: "duration", label: "Duration", placeholder: "8 weeks" },
                  { key: "level", label: "Level", placeholder: "Beginner" },
                  { key: "pace", label: "Pace", placeholder: "5-7 hrs/wk" },
                ].map(({ key, label, placeholder }) => (
                  <label key={key} className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                    {label}
                    <input
                      value={courseForm[key as keyof CourseFormState] as string}
                      onChange={(event) => setCourseForm((prev) => ({ ...prev, [key]: event.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              {[
                { key: "prerequisites", label: "Prerequisites" },
                { key: "outcomes", label: "Outcomes" },
                { key: "practices", label: "Practices" },
                { key: "projects", label: "Projects" },
              ].map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                  {label} <span className="text-[10px] normal-case text-gray-500">One item per line</span>
                  <textarea
                    value={courseForm[key as keyof CourseFormState] as string}
                    onChange={(event) => setCourseForm((prev) => ({ ...prev, [key]: event.target.value }))}
                    rows={3}
                    className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] uppercase tracking-[0.35em] text-gray-500">Preview JSON</span>
              <button
                type="button"
                onClick={() => handleCopy(coursePreview)}
                className="rounded-full border border-electric/40 px-4 py-1 text-[11px] font-semibold text-electric-light transition hover:border-electric hover:text-electric"
              >
                Copy Preview
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-[12px] leading-relaxed text-gray-200 shadow-inner shadow-black/40">
{JSON.stringify(coursePreview, null, 2)}
            </pre>
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-electric px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light"
            >
              Save Course Draft
            </button>
          </form>

          <form
            onSubmit={handleLessonSubmit}
            className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-editor-panel/50 p-8 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Lesson Builder</p>
                <h2 className="text-xl font-semibold text-white">Attach video & metadata</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLessonForm(emptyLessonForm);
                  setFeedback("Lesson form cleared.");
                }}
                className="text-xs text-gray-400 transition hover:text-white"
              >
                Reset form
              </button>
            </div>
            <div className="grid gap-4">
              {[
                { key: "courseSlug", label: "Course Slug", placeholder: "c-foundations" },
                { key: "lessonId", label: "Lesson ID", placeholder: "lesson-9" },
              ].map(({ key, label, placeholder }) => (
                <label key={key} className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                  {label}
                  <input
                    required
                    value={lessonForm[key as keyof LessonFormState] as string}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, [key]: event.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                  />
                </label>
              ))}
              <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                Lesson Title
                <input
                  required
                  value={lessonForm.title}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                Summary
                <textarea
                  value={lessonForm.summary}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, summary: event.target.value }))}
                  rows={2}
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                Intro / Description
                <textarea
                  value={lessonForm.intro}
                  onChange={(event) => setLessonForm((prev) => ({ ...prev, intro: event.target.value }))}
                  rows={3}
                  className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                  Duration
                  <input
                    value={lessonForm.duration}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, duration: event.target.value }))}
                    placeholder="45 min"
                    className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                  Video URL
                  <input
                    type="url"
                    required
                    value={lessonForm.videoUrl}
                    onChange={(event) => setLessonForm((prev) => ({ ...prev, videoUrl: event.target.value }))}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full rounded border border-white/10 bg-editor-surface px-3 py-2 text-sm text-white focus:border-electric focus:outline-none"
                  />
                </label>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] uppercase tracking-[0.35em] text-gray-500">Preview JSON</span>
              <button
                type="button"
                onClick={() => handleCopy(lessonPreview)}
                className="rounded-full border border-electric/40 px-4 py-1 text-[11px] font-semibold text-electric-light transition hover:border-electric hover:text-electric"
              >
                Copy Preview
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-[12px] leading-relaxed text-gray-200 shadow-inner shadow-black/40">
{JSON.stringify(lessonPreview, null, 2)}
            </pre>
            <button
              type="submit"
              className="mt-1 inline-flex items-center justify-center rounded-full bg-electric px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light"
            >
              Save Lesson Draft
            </button>
          </form>
        </section>

        <section className="mt-12 space-y-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Courses</p>
                <h2 className="text-xl font-semibold text-white">Saved course drafts</h2>
              </div>
              {draftCourses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftCourses([]);
                    setFeedback("Cleared all course drafts.");
                  }}
                  className="text-xs text-gray-400 transition hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>
            {draftCourses.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-sm text-gray-400">
                No course drafts yet. Complete the builder above to capture one.
              </p>
            ) : (
              <ul className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {draftCourses.map((course, index) => (
                  <li
                    key={`${course.slug}-${index}`}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-editor-panel/60 p-5 shadow-inner shadow-black/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{course.title || "Untitled"}</p>
                        <p className="text-xs text-gray-400">{course.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(course)}
                          className="rounded-full border border-electric/40 px-3 py-1 text-[11px] font-semibold text-electric-light transition hover:border-electric hover:text-electric"
                        >
                          Copy JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(index)}
                          className="rounded-full border border-rose-400/40 px-3 py-1 text-[11px] font-semibold text-rose-300 transition hover:border-rose-300 hover:text-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <pre className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-gray-200 shadow-inner shadow-black/40">
{JSON.stringify(course, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">Lessons</p>
                <h2 className="text-xl font-semibold text-white">Saved lesson drafts</h2>
              </div>
              {draftLessons.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftLessons([]);
                    setFeedback("Cleared all lesson drafts.");
                  }}
                  className="text-xs text-gray-400 transition hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>
            {draftLessons.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-sm text-gray-400">
                No lesson drafts yet. Use the lesson builder to capture a recording.
              </p>
            ) : (
              <ul className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {draftLessons.map((lesson, index) => (
                  <li
                    key={`${lesson.lessonId}-${index}`}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-white/10 bg-editor-panel/60 p-5 shadow-inner shadow-black/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{lesson.title || "Untitled Lesson"}</p>
                        <p className="text-xs text-gray-400">{lesson.courseSlug} · {lesson.lessonId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(lesson)}
                          className="rounded-full border border-electric/40 px-3 py-1 text-[11px] font-semibold text-electric-light transition hover:border-electric hover:text-electric"
                        >
                          Copy JSON
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(index)}
                          className="rounded-full border border-rose-400/40 px-3 py-1 text-[11px] font-semibold text-rose-300 transition hover:border-rose-300 hover:text-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <pre className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-gray-200 shadow-inner shadow-black/40">
{JSON.stringify(lesson, null, 2)}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPage;
