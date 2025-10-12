import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import { Course, CourseLessonsResponse, LessonDetail } from "../types/course";

const initialLessonForm = {
  title: "",
  description: "",
  notes: "",
  orderIndex: "",
  courseId: "",
};

const AdminPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonForm, setLessonForm] = useState(initialLessonForm);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonDetail[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear().toString(),
    orderIndex: "",
  });
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [courseFeedback, setCourseFeedback] = useState<string | null>(null);
  const [courseError, setCourseError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      const { data } = await api.get<Course[]>("/courses");
      setCourses(data);
      if (data.length > 0) {
        setLessonForm((prev) =>
          prev.courseId
            ? prev
            : {
                ...prev,
                courseId: String(data[0].id),
              }
        );
      }
      return data;
    } catch (err) {
      console.error("Failed to load courses", err);
      setCourseError("Unable to load courses. Please try again later.");
      return [] as Course[];
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const loadLessons = useCallback(
    async (courseId: string) => {
      if (!courseId) {
        setLessons([]);
        return;
      }
      setLessonsLoading(true);
      try {
        const { data } = await api.get<CourseLessonsResponse>(`/lessons/${courseId}`);
        setLessons(data.lessons);
      } catch (err) {
        console.error("Failed to load lessons", err);
        setLessons([]);
      } finally {
        setLessonsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (lessonForm.courseId) {
      void loadLessons(lessonForm.courseId);
    } else {
      setLessons([]);
    }
  }, [lessonForm.courseId, loadLessons]);

  const hasCourses = courses.length > 0;

  const handleLessonInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setLessonForm((prev) => ({ ...prev, [name]: value }));
    if (name === "courseId") {
      setEditingLessonId(null);
      setLessonFeedback(null);
      setLessonError(null);
      setVideoFile(null);
    }
  };

  const resetForm = () => {
    setLessonForm((prev) => ({
      ...initialLessonForm,
      courseId: prev.courseId,
    }));
    setVideoFile(null);
    setEditingLessonId(null);
    setLessonFeedback(null);
    setLessonError(null);
  };

  const selectedCourseTitle = useMemo(() => {
    const selected = courses.find((course) => course.id === Number(lessonForm.courseId));
    return selected?.title ?? "";
  }, [courses, lessonForm.courseId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lessonForm.title || !lessonForm.description || !lessonForm.courseId) {
      setLessonError("Please fill in the lesson title, description, and select a course.");
      return;
    }

    const formData = new FormData();
    formData.append("title", lessonForm.title);
    formData.append("description", lessonForm.description);
    formData.append("course_id", lessonForm.courseId);
    formData.append("notes", lessonForm.notes);
    if (lessonForm.orderIndex.trim()) {
      formData.append("order_index", lessonForm.orderIndex.trim());
    }
    if (videoFile) {
      formData.append("video_file", videoFile);
    }

    setSubmitting(true);
    setLessonError(null);
    setLessonFeedback(null);

    try {
      if (editingLessonId) {
        await api.patch(`/admin/lessons/${editingLessonId}`, formData);
        setLessonFeedback(`Lesson "${lessonForm.title}" updated successfully.`);
      } else {
        const { data } = await api.post("/admin/lessons", formData);
        setLessonFeedback(`Lesson "${data.title ?? lessonForm.title}" created successfully.`);
      }
      setVideoFile(null);
      setEditingLessonId(null);
      await loadLessons(lessonForm.courseId);
    } catch (submissionError) {
      console.error("Lesson creation failed", submissionError);
      setLessonError("Unable to save lesson. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCourseInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetCourseForm = () => {
    setCourseForm({ title: "", description: "", year: new Date().getFullYear().toString(), orderIndex: "" });
  };

  const handleCourseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseForm.title || !courseForm.description || !courseForm.year) {
      setCourseError("Please fill in the course title, description, and year.");
      return;
    }

    const yearValue = Number(courseForm.year);
    const orderValue = courseForm.orderIndex.trim() ? Number(courseForm.orderIndex) : undefined;
    if (!Number.isFinite(yearValue)) {
      setCourseError("Year must be a valid number.");
      return;
    }

    setCourseSubmitting(true);
    setCourseError(null);
    setCourseFeedback(null);

    try {
      const { data } = await api.post<Course>("/courses", {
        title: courseForm.title,
        description: courseForm.description,
        year: yearValue,
        order_index: orderValue ?? 0,
      });
      setCourseFeedback(`Course "${courseForm.title}" created successfully.`);
      resetCourseForm();
      setLessonForm((prev) => ({ ...prev, courseId: String(data.id) }));
      await loadCourses();
      await loadLessons(String(data.id));
    } catch (err) {
      console.error("Course creation failed", err);
      setCourseError("Unable to create course. Please check the details and try again.");
    } finally {
      setCourseSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 bg-slate-100 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
          Admin workspace
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Create a New Lesson</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Upload lesson media, notes, and metadata. Videos will be available instantly to students once the lesson is saved.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create a course</h2>
          <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">
            Add a new course before uploading lessons. Students will see courses in the dashboard immediately.
          </p>
          <form onSubmit={handleCourseSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                Course Title
              </label>
              <input
                name="title"
                value={courseForm.title}
                onChange={handleCourseInputChange}
                placeholder="Year 1 Foundations"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                Description
              </label>
              <textarea
                name="description"
                value={courseForm.description}
                onChange={handleCourseInputChange}
                rows={3}
                placeholder="Bootcamp foundations for Orus School"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
                required
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  Year
                </label>
                <input
                  name="year"
                  value={courseForm.year}
                  onChange={handleCourseInputChange}
                  type="number"
                  placeholder="2025"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  Order index
                </label>
                <input
                  name="orderIndex"
                  value={courseForm.orderIndex}
                  onChange={handleCourseInputChange}
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={courseSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {courseSubmitting ? "Saving course..." : "Create course"}
              </button>
              <button
                type="button"
                onClick={resetCourseForm}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>
            </div>

            {courseFeedback ? (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:border-emerald-400/40 dark:text-emerald-300">
                {courseFeedback}
              </div>
            ) : null}

            {courseError ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:border-rose-400/40 dark:text-rose-300">
                {courseError}
              </div>
            ) : null}
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Existing courses</h2>
          <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">
            Lessons can be attached to any published course. Create a course first, then upload lessons.
          </p>
          {courses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No courses yet. Create your first course using the form on the left.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {courses.map((course) => (
                <li key={course.id} className="p-4 text-sm text-slate-700 dark:text-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Year {course.year} · Order {course.order_index}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      ID {course.id}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{course.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lessons</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select a lesson to edit. Uploading a new video will replace the existing file.
            </p>
          </div>
          {editingLessonId ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel editing
            </button>
          ) : null}
        </div>
        <div className="mt-4">
          {lessonsLoading ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading lessons...
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No lessons for this course yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {lessons.map((lesson) => (
                <li key={lesson.id} className="p-4 text-sm text-slate-700 dark:text-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{lesson.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Order {lesson.order_index} · Lesson ID {lesson.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {lesson.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.video_url ? (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                          Video attached
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                          No video
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLessonId(lesson.id);
                          setLessonForm({
                            title: lesson.title,
                            description: lesson.description,
                            notes: lesson.notes ?? "",
                            orderIndex: lesson.order_index !== undefined && lesson.order_index !== null ? String(lesson.order_index) : "",
                            courseId: String(lesson.course_id),
                          });
                          setLessonFeedback(null);
                          setLessonError(null);
                          setVideoFile(null);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                      >
                        Edit lesson
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Delete lesson "${lesson.title}"? This cannot be undone.`
                            )
                          ) {
                            return;
                          }
                          try {
                            await api.delete(`/admin/lessons/${lesson.id}`);
                            setLessonFeedback(`Lesson "${lesson.title}" deleted.`);
                            await loadLessons(lessonForm.courseId);
                            if (editingLessonId === lesson.id) {
                              resetForm();
                            }
                          } catch (err) {
                            console.error("Failed to delete lesson", err);
                            setLessonError("Unable to delete lesson. Please try again.");
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 dark:border-rose-500/50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Lesson Title
            </label>
            <input
              name="title"
              value={lessonForm.title}
              onChange={handleLessonInputChange}
              placeholder="Intro to pointers"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Description
            </label>
            <textarea
              name="description"
              value={lessonForm.description}
              onChange={handleLessonInputChange}
              rows={3}
              placeholder="Brief summary displayed in the lesson overview."
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Course
            </label>
            <select
              name="courseId"
              value={lessonForm.courseId}
              onChange={handleLessonInputChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
              required
              disabled={!hasCourses}
            >
              <option value="" disabled>
                {hasCourses ? "Select a course" : "Loading courses..."}
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            {selectedCourseTitle ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">Selected: {selectedCourseTitle}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Lesson Notes (supports Markdown)
            </label>
            <textarea
              name="notes"
              value={lessonForm.notes}
              onChange={handleLessonInputChange}
              rows={6}
              placeholder="### Learning objectives\n- Understand pointers\n- Trace memory diagrams"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Optional Order Index
            </label>
            <input
              name="orderIndex"
              value={lessonForm.orderIndex}
              onChange={handleLessonInputChange}
              type="number"
              min="1"
              placeholder="Leave blank to append to the end"
              className="w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Lesson Video
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">MP4 or MOV recommended. Files are stored securely on the server.</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving lesson..."
                : editingLessonId
                ? "Update lesson"
                : "Create lesson"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset form
            </button>
          </div>

          {lessonFeedback ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:border-emerald-400/40 dark:text-emerald-300">
              {lessonFeedback}
            </div>
          ) : null}

          {lessonError ? (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-600 dark:border-rose-400/40 dark:text-rose-300">
              {lessonError}
            </div>
          ) : null}
        </form>
      </section>
    </div>
  );
};

export default AdminPage;
