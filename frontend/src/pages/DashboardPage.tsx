import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context";

type Course = {
  id: number;
  title: string;
  description: string;
  year: number;
  order_index: number;
};

type ProgressEntry = {
  id: number;
  student_id: number;
  course_id: number;
  completed: boolean;
  score?: number | null;
};

type ProgressResponse = {
  courses: Course[];
  progress: ProgressEntry[];
  completion_rate: number;
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressEntry>>({});
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data } = await api.get<ProgressResponse>(`/progress/${user.id}`);
        setCourses(data.courses);
        const mapping: Record<number, ProgressEntry> = {};
        data.progress.forEach((entry) => {
          mapping[entry.course_id] = entry;
        });
        setProgressMap(mapping);
        setCompletionRate(data.completion_rate);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const groupedCourses = useMemo(() => {
    return courses.reduce<Record<number, Course[]>>((acc, course) => {
      acc[course.year] = acc[course.year] ?? [];
      acc[course.year].push(course);
      acc[course.year].sort((a, b) => a.order_index - b.order_index);
      return acc;
    }, {});
  }, [courses]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Welcome back, {user?.name}</h2>
        <p className="mt-2 text-sm text-slate-500">Here is a snapshot of your learning journey.</p>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <span>Overall progress</span>
            <span>{completionRate.toFixed(0)}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-brand"
              style={{ width: `${completionRate}%`, transition: "width 0.5s ease" }}
            />
          </div>
        </div>
      </section>
      {Object.entries(groupedCourses).map(([year, modules]) => {
        const locked = Number(year) === 2 && completionRate < 50; // simple rule for demo
        return (
          <section key={year} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Year {year}</h3>
              {locked ? <span className="text-sm text-amber-600">Finish Year 1 to unlock</span> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((course) => {
                const progress = progressMap[course.id];
                const completed = progress?.completed;
                return (
                  <Link
                    key={course.id}
                    to={locked ? "#" : `/courses/${course.id}`}
                    className={`rounded-2xl border border-slate-200 bg-white p-6 shadow transition hover:-translate-y-1 hover:shadow-lg ${
                      locked ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{course.title}</h4>
                        <p className="mt-2 text-sm text-slate-500">{course.description}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {completed ? "Completed" : "In progress"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default DashboardPage;
