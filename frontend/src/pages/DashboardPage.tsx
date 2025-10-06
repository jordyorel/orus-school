import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import AnnouncementsPanel, { Announcement } from "../components/AnnouncementsPanel";
import CourseCard from "../components/CourseCard";
import ProgressBar from "../components/ProgressBar";
import { useAuth } from "../context";

export type Course = {
  id: number;
  title: string;
  description: string;
  year: number;
  order_index: number;
};

export type CourseProgressSummary = {
  course: Course;
  status: "completed" | "in_progress" | "locked";
  completion_percentage: number;
  lessons_completed: number;
  lessons_total: number;
  exercises_completed: number;
  exercises_total: number;
};

export type LessonProgressRecord = {
  lesson_id: number;
  completed: boolean;
};

export type ExerciseProgressRecord = {
  exercise_id: number;
  status: string;
};

export type ProgressResponse = {
  courses: CourseProgressSummary[];
  lesson_progress: LessonProgressRecord[];
  exercise_progress: ExerciseProgressRecord[];
  overall_completion_rate: number;
};

const announcements: Announcement[] = [
  {
    id: 1,
    title: "New Tutorial Available",
    description: "Deep dive into memory management patterns with fresh examples and exercises.",
    date: "Mar 12, 2024",
    icon: "📢",
    highlight: true
  },
  {
    id: 2,
    title: "Community AMA",
    description: "Join the live Q&A with mentors this Friday at 5PM UTC in our Discord server.",
    date: "Mar 10, 2024",
    icon: "💬"
  },
  {
    id: 3,
    title: "Project Showcase",
    description: "Submit your favorite projects before March 25 to be featured in the hall of fame!",
    date: "Mar 07, 2024",
    icon: "🚀"
  }
];

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("orus-dashboard-theme") === "dark";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("orus-dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data } = await api.get<ProgressResponse>(`/progress/${user.id}`);
        setProgress(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const groupedByYear = useMemo(() => {
    const result = new Map<number, CourseProgressSummary[]>();
    progress?.courses.forEach((entry) => {
      const list = result.get(entry.course.year) ?? [];
      list.push(entry);
      result.set(entry.course.year, list);
    });
    return result;
  }, [progress]);

  const yearKeys = useMemo(() => Array.from(groupedByYear.keys()).sort((a, b) => a - b), [groupedByYear]);

  const yearUnlockMap = useMemo(() => {
    const map = new Map<number, boolean>();
    let previousYearsComplete = true;
    yearKeys.forEach((year) => {
      const courses = groupedByYear.get(year) ?? [];
      const yearComplete = courses.length > 0 && courses.every((course) => course.status === "completed");
      map.set(year, previousYearsComplete);
      previousYearsComplete = previousYearsComplete && yearComplete;
    });
    return map;
  }, [groupedByYear, yearKeys]);

  const motivationalMessage = useMemo(() => {
    if (!progress) return "Keep going — every lesson mastered opens the next door.";
    if (progress.overall_completion_rate >= 90) {
      return "🌟 You're on the brink of mastery! Final stretch ahead.";
    }
    if (progress.overall_completion_rate >= 50) {
      return "🚀 Halfway there! Your consistency is paying off.";
    }
    return "🔥 Every line of code gets you closer to unlocking the next track.";
  }, [progress]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Dashboard
            </span>
            <span>Welcome back, {user.name}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Your learning journey</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode((value) => !value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {isDarkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-lg font-semibold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="text-sm">
              <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-slate-500 dark:text-slate-400">Student</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Overall progress</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track your journey across every course and exercise.</p>
              </div>
              <ProgressBar value={progress?.overall_completion_rate ?? 0} size="lg" />
            </div>
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 p-5 text-sm font-medium text-slate-700 dark:text-slate-200">
              {motivationalMessage}
            </div>
          </section>

          {yearKeys.map((year) => {
            const courses = groupedByYear.get(year) ?? [];
            const unlocked = yearUnlockMap.get(year) ?? true;
            return (
              <section key={year} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Year {year}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {unlocked
                        ? "Choose a lesson to keep building your skills."
                        : "Complete the previous year to unlock these modules."}
                    </p>
                  </div>
                  {!unlocked ? (
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      Locked
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {courses.map((entry) => {
                    const locked = !unlocked || entry.status === "locked";
                    return (
                      <CourseCard
                        key={entry.course.id}
                        title={entry.course.title}
                        description={entry.course.description}
                        status={locked ? "locked" : entry.status}
                        completion={entry.completion_percentage}
                        yearLabel={`Year ${entry.course.year}`}
                        onClick={() =>
                          locked ? undefined : navigate(`/app/courses/${entry.course.id}`)
                        }
                      />
                    );
                  })}
                  {courses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      Courses for this year will appear soon.
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
          {!loading && (progress?.courses.length ?? 0) === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              Courses will appear here as soon as your administrator assigns them.
            </div>
          ) : null}
        </div>
        <AnnouncementsPanel announcements={announcements} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Loading your courses...
        </div>
      ) : null}
    </div>
  );
};

export default DashboardPage;
