import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context";

type Course = {
  id: number;
  title: string;
  description: string;
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
};

const CoursePage = () => {
  const { courseId } = useParams();
  const numericId = Number(courseId);
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({ title: "", description: "", github_link: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: courseList }, { data: projectList }] = await Promise.all([
        api.get<Course[]>("/courses"),
        api.get<Project[]>("/projects"),
      ]);
      setCourses(courseList);
      setProjects(projectList.filter((project) => project.course_id === numericId));
    };
    void load();
  }, [numericId]);

  const course = useMemo(() => courses.find((item) => item.id === numericId), [courses, numericId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!course) return;
    setSubmitting(true);
    try {
      const payload = { ...form, course_id: course.id };
      const { data } = await api.post<Project>("/projects/submit", payload);
      setProjects((prev) => [data, ...prev]);
      setForm({ title: "", description: "", github_link: "" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!course) {
    return <div className="rounded bg-white p-6 shadow">Course not found.</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold text-slate-900">{course.title}</h2>
        <p className="mt-2 text-slate-600">{course.description}</p>
        <p className="mt-4 text-sm text-slate-500">Year {course.year} · Module {course.order_index + 1}</p>
      </section>
      {user?.role === "student" ? (
        <section className="rounded-2xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-900">Submit your project</h3>
          <p className="mt-1 text-sm text-slate-500">Share your repository link and describe your approach.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="title">
                Project title
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                required
                rows={4}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="github_link">
                GitHub link
              </label>
              <input
                id="github_link"
                type="url"
                required
                value={form.github_link}
                onChange={(event) => setForm({ ...form, github_link: event.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit project"}
            </button>
          </form>
        </section>
      ) : null}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Your submissions</h3>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No submissions yet.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <article key={project.id} className="rounded-2xl bg-white p-6 shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{project.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                    <a
                      href={project.github_link ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center text-sm font-medium text-brand"
                    >
                      View repository
                    </a>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                    {project.status}
                  </span>
                </div>
                {project.feedback ? (
                  <div className="mt-4 rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
                    <div className="font-semibold">Feedback</div>
                    <p className="mt-2 whitespace-pre-wrap">{project.feedback}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CoursePage;
