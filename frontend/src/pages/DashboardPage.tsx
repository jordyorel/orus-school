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

const yearLabels: Record<number, string> = {
  1: "Foundations",
  2: "Advanced & Specializations"
};

const courseEmojis: Record<string, string> = {
  "C Basics": "💻",
  "Shell & Git": "🧰",
  "Memory & I/O": "🧠",
  Networking: "🌐",
  Specialization: "🎯"
};

const announcements = [
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
    icon: "💬",
    highlight: false
  },
  {
    id: 3,
    title: "Project Showcase",
    description: "Submit your favorite projects before March 25 to be featured in the hall of fame!",
    date: "Mar 07, 2024",
    icon: "🚀",
    highlight: false
  }
];

const quotes = [
  {
    text: "Debugging is like being the detective in a crime movie where you are also the murderer.",
    author: "Filipe Fortes"
  },
  {
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes"
  },
  {
    text: "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.",
    author: "Patrick McKenzie"
  }
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, ProgressEntry>>({});
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<number | null>(null);
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

  const years = useMemo(() => Object.keys(groupedCourses).map(Number).sort((a, b) => a - b), [groupedCourses]);

  useEffect(() => {
    if (years.length && activeYear === null) {
      setActiveYear(years[0]);
    }
  }, [years, activeYear]);

  const totalCourses = courses.length || 1;
  const completedCourses = courses.filter((course) => progressMap[course.id]?.completed).length;
  const inProgressCourses = courses.filter((course) => {
    const entry = progressMap[course.id];
    return entry && !entry.completed;
  }).length;

  const completedPercent = (completedCourses / totalCourses) * 100;
  const inProgressPercent = (inProgressCourses / totalCourses) * 100;
  const lockedPercent = Math.max(0, 100 - completedPercent - inProgressPercent);

  const unlockedYear = completionRate >= 50 ? 2 : 1;
  const currentYearLabel = yearLabels[unlockedYear] ?? `Year ${unlockedYear}`;
  const yearOneCourses = groupedCourses[1] ?? [];
  const yearOneCompleted = yearOneCourses.filter((course) => progressMap[course.id]?.completed).length;
  const projectsAway = Math.max(yearOneCourses.length - yearOneCompleted, 0);

  const motivationalMessage = unlockedYear > 1
    ? "You unlocked Year 2! Keep exploring advanced challenges."
    : projectsAway > 0
      ? `Keep going! You're only ${projectsAway} project${projectsAway === 1 ? "" : "s"} away from unlocking Year 2 🚀`
      : "Finish your remaining projects to unlock the next adventure!";

  const quoteIndex = useMemo(() => (new Date().getDate() % quotes.length), []);
  const quote = quotes[quoteIndex];

  const initials = useMemo(() => {
    if (!user?.name) return "";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-3xl bg-white/70 px-6 py-4 text-slate-600 shadow-soft dark:bg-slate-900/60 dark:text-slate-300">
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-white/80 p-6 shadow-soft backdrop-blur transition dark:bg-slate-900/60 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-sky-500 text-2xl font-semibold text-white shadow-glow">
              {initials || "👩‍🎓"}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">👋 Welcome back</p>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">{user?.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Here’s what’s waiting for you today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start rounded-full bg-slate-100/80 p-1 text-xs font-medium text-slate-500 transition dark:bg-slate-800/80 dark:text-slate-300">
            <div className="rounded-full bg-white px-3 py-1.5 text-slate-700 shadow-sm dark:bg-slate-900/70 dark:text-slate-100">
              {completionRate.toFixed(0)}% complete
            </div>
            <div className="rounded-full px-3 py-1.5">{`Year ${unlockedYear}: ${currentYearLabel}`}</div>
            <button
              onClick={() => setIsDarkMode((mode) => !mode)}
              className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
            >
              {isDarkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-inner transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{completedCourses}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Out of {totalCourses} courses</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-inner transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">In progress</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{inProgressCourses}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Keep up the momentum!</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-inner transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-white/5">
            <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Current focus</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Year {unlockedYear}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{currentYearLabel}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-gradient-to-r from-emerald-400/90 via-sky-400/90 to-indigo-400/90 p-[1px] shadow-glow">
        <div className="rounded-[calc(1.875rem-1px)] bg-white/95 p-8 text-slate-900 transition dark:bg-slate-950/80 dark:text-slate-100">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                Progress overview
              </p>
              <h2 className="mt-2 text-3xl font-semibold">{completionRate.toFixed(0)}% Complete</h2>
              <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-300">{motivationalMessage}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-400" /> Completed
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-300" /> In progress
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-200" /> Locked
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-400 transition-[width] duration-700"
                style={{ width: `${completedPercent}%` }}
              />
              <div
                className="h-full bg-amber-300 transition-[width] duration-700"
                style={{ width: `${inProgressPercent}%` }}
              />
              <div className="h-full bg-slate-300/70" style={{ width: `${lockedPercent}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Course roadmap</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Track your foundations and unlock specializations as you progress.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/60 p-1 shadow-inner dark:bg-white/5">
              {years.map((year) => {
                const locked = year > unlockedYear;
                return (
                  <button
                    key={year}
                    onClick={() => !locked && setActiveYear(year)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeYear === year
                        ? "bg-slate-900 text-white shadow-soft dark:bg-white/20 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    } ${locked ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <span className="text-base">{year <= unlockedYear ? "🟢" : "🔒"}</span>
                    Year {year}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(groupedCourses[activeYear ?? 0] ?? []).map((course) => {
              const entry = progressMap[course.id];
              const completed = entry?.completed;
              const started = Boolean(entry);
              const locked = (activeYear ?? 0) > unlockedYear;
              const status = locked ? "Locked" : completed ? "Completed" : started ? "In Progress" : "Not started";
              const statusStyles = locked
                ? "bg-slate-200 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                : completed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : started
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-200";
              const ringValue = completed ? 100 : started ? 55 : 8;

              return (
                <Link
                  key={course.id}
                  to={locked ? "#" : `/app/courses/${course.id}`}
                  className={`group relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow dark:border-white/10 dark:bg-slate-900/70 ${
                    locked ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/0 dark:via-white/5" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 transition dark:bg-slate-800/80 dark:text-slate-200">
                        {courseEmojis[course.title] ?? "📘"} {course.title}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{course.description}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}>
                        {status === "Locked" ? "🔒" : status === "Completed" ? "✅" : status === "In Progress" ? "⏳" : "🟡"}
                        {status}
                      </span>
                    </div>
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 shadow-inner transition group-hover:scale-105 dark:bg-slate-800/70">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full text-sm font-semibold text-slate-700 transition group-hover:text-slate-900 dark:text-slate-200"
                        style={{
                          background: `conic-gradient(#34d399 ${ringValue}%, rgba(148, 163, 184, 0.25) ${ringValue}% 100%)`
                        }}
                      >
                        <span className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 dark:text-slate-100">
                          {completed ? "100%" : started ? "55%" : "0%"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>View course</span>
                    <span className="transition group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl bg-white/80 p-6 shadow-soft backdrop-blur transition dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Announcements</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                {announcements.length} new
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`rounded-2xl border border-white/60 bg-white/70 p-4 text-sm shadow-inner transition hover:-translate-y-0.5 hover:shadow-soft dark:border-white/10 dark:bg-slate-900/40 ${
                    announcement.highlight ? "ring-2 ring-emerald-300/70 dark:ring-emerald-400/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                    <span className="text-xl">{announcement.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{announcement.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {announcement.date}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">{announcement.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white/80 p-6 shadow-soft backdrop-blur transition dark:bg-slate-900/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <Link
                to="#"
                className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/10"
              >
                <span className="flex items-center gap-3">
                  <span>🚀</span>
                  Submit new project
                </span>
                <span>→</span>
              </Link>
              <Link
                to="#"
                className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-inner transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-slate-800/80 dark:text-slate-100"
              >
                <span className="flex items-center gap-3">
                  <span>📂</span>
                  Check feedback
                </span>
                <span>→</span>
              </Link>
              <Link
                to="#"
                className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 shadow-inner transition hover:-translate-y-0.5 hover:shadow-soft dark:bg-slate-800/80 dark:text-slate-100"
              >
                <span className="flex items-center gap-3">
                  <span>💬</span>
                  Ask for help
                </span>
                <span>→</span>
              </Link>
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-3xl border border-white/60 bg-white/70 p-6 text-center shadow-inner transition dark:border-white/10 dark:bg-slate-900/60">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Quote of the day</p>
        <blockquote className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-200">
          “{quote.text}”
        </blockquote>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">— {quote.author}</p>
      </section>
    </div>
  );
};

export default DashboardPage;
