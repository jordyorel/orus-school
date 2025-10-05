import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useAuth } from "../context";

type User = {
  id: number;
  name: string;
  email: string;
};

type Course = {
  id: number;
  title: string;
  year: number;
  order_index: number;
};

type Project = {
  id: number;
  title: string;
  description: string;
  github_link?: string | null;
  status: string;
  feedback?: string | null;
  course_id: number;
  student_id: number;
};

type CourseForm = {
  title: string;
  description: string;
  year: number;
  order_index: number;
};

const emptyCourseForm: CourseForm = {
  title: "",
  description: "",
  year: 1,
  order_index: 0,
};

const AdminPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
  const [savingCourse, setSavingCourse] = useState(false);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({});

  const loadData = async () => {
    const [{ data: userList }, { data: courseList }, { data: projectList }] = await Promise.all([
      api.get<User[]>("/users"),
      api.get<Course[]>("/courses"),
      api.get<Project[]>("/projects"),
    ]);
    setStudents(userList.filter((item) => item.id !== user?.id));
    setCourses(courseList);
    setProjects(projectList);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setFeedbackDrafts((prev) => {
      const next: Record<number, string> = {};
      projects.forEach((project) => {
        next[project.id] = prev[project.id] ?? project.feedback ?? "";
      });
      return next;
    });
  }, [projects]);

  const projectByStudent = useMemo(() => {
    return projects.reduce<Record<number, Project[]>>((acc, project) => {
      acc[project.student_id] = acc[project.student_id] ?? [];
      acc[project.student_id].push(project);
      return acc;
    }, {});
  }, [projects]);

  const handleProjectUpdate = async (projectId: number, updates: Partial<Project>) => {
    const { data } = await api.patch<Project>(`/projects/${projectId}`, updates);
    setProjects((prev) => prev.map((item) => (item.id === projectId ? data : item)));
  };

  const handleCourseSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingCourse(true);
    try {
      await api.post<Course>("/courses", courseForm);
      setCourseForm(emptyCourseForm);
      await loadData();
    } finally {
      setSavingCourse(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Add a new course</h2>
        <form onSubmit={handleCourseSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              required
              value={courseForm.title}
              onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              required
              rows={3}
              value={courseForm.description}
              onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="year">
              Year
            </label>
            <select
              id="year"
              value={courseForm.year}
              onChange={(event) => setCourseForm({ ...courseForm, year: Number(event.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value={1}>Year 1</option>
              <option value={2}>Year 2</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="order_index">
              Order index
            </label>
            <input
              id="order_index"
              type="number"
              min={0}
              value={courseForm.order_index}
              onChange={(event) => setCourseForm({ ...courseForm, order_index: Number(event.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={savingCourse}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:opacity-60"
            >
              {savingCourse ? "Saving..." : "Add course"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Existing curriculum</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{course.title}</td>
                  <td className="px-4 py-3">Year {course.year}</td>
                  <td className="px-4 py-3">{course.order_index + 1}</td>
                </tr>
              ))}
              {courses.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-sm text-slate-500" colSpan={3}>
                    No courses yet. Use the form above to add your first module.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Student submissions</h2>
        {students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No students yet. Share the platform with your cohort!
          </div>
        ) : (
          <div className="space-y-6">
            {students.map((student) => (
              <article key={student.id} className="rounded-2xl bg-white p-6 shadow">
                <header className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{student.name}</h3>
                    <p className="text-sm text-slate-500">{student.email}</p>
                  </div>
                  <span className="text-sm text-slate-500">{projectByStudent[student.id]?.length ?? 0} submissions</span>
                </header>
                <div className="mt-4 space-y-4">
                  {(projectByStudent[student.id] ?? []).map((project) => (
                    <div key={project.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900">{project.title}</h4>
                          <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                          <a
                            href={project.github_link ?? "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-sm font-medium text-brand"
                          >
                            View repository
                          </a>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </label>
                          <select
                            value={project.status}
                            onChange={(event) =>
                              handleProjectUpdate(project.id, { status: event.target.value })
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="in review">In review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Feedback
                          </label>
                          <textarea
                            value={feedbackDrafts[project.id] ?? ""}
                            rows={3}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                            onChange={(event) =>
                              setFeedbackDrafts((prev) => ({ ...prev, [project.id]: event.target.value }))
                            }
                            onBlur={() =>
                              handleProjectUpdate(project.id, {
                                feedback: feedbackDrafts[project.id] ?? "",
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
