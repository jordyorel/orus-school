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

type Achievement = {
  id: number;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressText: string;
};

type LearningPulse = {
  id: number;
  title: string;
  description: string;
  type: "event" | "milestone" | "reminder";
  action?: string;
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

const heroBadges = [
  { id: "track", label: "Track", value: "Systems & Hardware" },
  { id: "cohort", label: "Cohort", value: "Spring 2024" },
  { id: "plan", label: "Plan", value: "Standard" }
];

const quickActions = [
  { id: 1, icon: "🚀", label: "Submit new project" },
  { id: 2, icon: "📂", label: "Check feedback" },
  { id: 3, icon: "💬", label: "Ask for help" },
  { id: 4, icon: "🤝", label: "Join study group" }
];

const learningGoals = [
  { id: 1, label: "Read Shell & Git guide" },
  { id: 2, label: "Push Memory module project" },
  { id: 3, label: "Review mentor feedback" }
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

  const upcomingCourse = courses.find((course) => !progressMap[course.id]?.completed);

  const heroStats = [
    {
      id: "completed",
      label: "Completed modules",
      value: completedCourses.toString().padStart(2, "0"),
      helper: `of ${totalCourses} total`
    },
    {
      id: "active",
      label: "Active projects",
      value: inProgressCourses > 0 ? inProgressCourses.toString().padStart(2, "0") : "00",
      helper: inProgressCourses > 0 ? "Keep the momentum" : "Start a new sprint"
    },
    {
      id: "milestone",
      label: "Next milestone",
      value: upcomingCourse ? upcomingCourse.title : "All caught up",
      helper: upcomingCourse ? "Due Mar 21" : "Nice work!"
    }
  ];

  const achievements: Achievement[] = useMemo(() => {
    return [
      {
        id: 1,
        icon: "🌱",
        title: "First Steps",
        description: "Submit your first project to kickstart your journey.",
        unlocked: completedCourses >= 1,
        progressText: completedCourses >= 1 ? "Unlocked" : "Complete 1 project"
      },
      {
        id: 2,
        icon: "🔥",
        title: "Momentum Builder",
        description: "Keep a streak by working on two courses in parallel.",
        unlocked: inProgressCourses >= 2 || completedCourses >= 2,
        progressText: inProgressCourses >= 2 || completedCourses >= 2 ? "Unlocked" : "Start a second course"
      },
      {
        id: 3,
        icon: "🛠️",
        title: "Halfway Hero",
        description: "Reach a 50% completion milestone across your roadmap.",
        unlocked: completionRate >= 50,
        progressText: completionRate >= 50 ? "Unlocked" : "Hit 50% completion"
      },
      {
        id: 4,
        icon: "🚀",
        title: "Launch Day",
        description: "Get ready to showcase your mastery with 90% completion.",
        unlocked: completionRate >= 90,
        progressText: completionRate >= 90 ? "Unlocked" : "Reach 90% completion"
      }
    ];
  }, [completedCourses, inProgressCourses, completionRate]);

  const learningPulse: LearningPulse[] = useMemo(() => {
    return [
      {
        id: 1,
        title: "Project feedback drop",
        description: "Mentors will review submissions every Tuesday and Friday.",
        type: "event",
        action: "Add to calendar"
      },
      {
        id: 2,
        title: "Community code jam",
        description: "Pair up with another learner this weekend and build together.",
        type: "milestone",
        action: "Reserve a seat"
      },
      {
        id: 3,
        title: "Deep focus sprint",
        description: "Block 45 minutes today to push your current project forward.",
        type: "reminder",
        action: "Start timer"
      }
    ];
  }, []);

  const nextAchievement = achievements.find((achievement) => !achievement.unlocked);

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
        <div className="rounded-[28px] bg-white/80 px-6 py-4 text-slate-600 shadow-lg backdrop-blur dark:bg-slate-900/70 dark:text-slate-200">
          Loading your dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/95 p-8 shadow-[0_60px_80px_-40px_rgba(15,23,42,0.25)] backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute -right-24 top-[-120px] h-64 w-64 rounded-full bg-emerald-200/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-120px] left-[-80px] h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="relative space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {heroBadges.map((badge) => (
                <span
                  key={badge.id}
                  className="rounded-full bg-emerald-50 px-4 py-2 text-emerald-600 shadow-inner dark:bg-emerald-500/10 dark:text-emerald-200"
                >
                  {badge.label}: {badge.value}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
              <button
                onClick={() => setIsDarkMode((mode) => !mode)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/10"
              >
                {isDarkMode ? "☀️ Light mode" : "🌙 Dark mode"}
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2 text-slate-700 shadow-inner transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/10 dark:text-white">
                ⬇️ Download profile
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative mx-auto h-24 w-24 shrink-0 rounded-[28px] bg-gradient-to-br from-emerald-400 to-sky-500 text-3xl font-semibold text-white shadow-[0_20px_40px_-20px_rgba(56,189,248,0.8)]">
                <div className="flex h-full w-full items-center justify-center">
                  {initials || "AL"}
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600 shadow-md dark:bg-slate-900 dark:text-emerald-300">
                  Year {unlockedYear}
                </span>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Student dashboard</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
                  {user?.name ?? "Ada Lovelace"}
                </h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Full-stack foundations · Cohort 2024</p>
                <div className="mt-6 grid gap-4 text-left text-sm text-slate-500 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Overall progress</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{completionRate.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Courses unlocked</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{years.length}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Active streak</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">06 days</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Last check-in</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Mar 18, 2024</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid w-full max-w-xl gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.id}
                  className="flex h-full flex-col justify-between rounded-[24px] border border-white/70 bg-white/80 p-4 text-sm text-slate-500 shadow-inner transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{stat.helper}</p>
                </div>
              ))}
            </div>
          </div>

          {nextAchievement && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-4 text-sm text-emerald-700 shadow-inner dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{nextAchievement.icon}</span>
                <div>
                  <p className="text-base font-semibold text-emerald-800 dark:text-emerald-100">Next badge: {nextAchievement.title}</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-200/80">{nextAchievement.progressText}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg dark:bg-emerald-400 dark:text-slate-900">
                Keep climbing
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/95 p-8 shadow-[0_60px_80px_-40px_rgba(15,23,42,0.2)] dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute -right-16 top-12 h-36 w-36 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-500">Progress overview</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{completionRate.toFixed(0)}% Complete</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-500 dark:text-slate-300">{motivationalMessage}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm text-slate-500 dark:text-slate-300">
              <div className="rounded-[20px] bg-emerald-100/70 px-4 py-3 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                <p className="text-xs uppercase tracking-[0.25em]">Completed</p>
                <p className="mt-2 text-xl text-emerald-700 dark:text-emerald-100">{completedCourses}</p>
              </div>
              <div className="rounded-[20px] bg-amber-100/80 px-4 py-3 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                <p className="text-xs uppercase tracking-[0.25em]">In progress</p>
                <p className="mt-2 text-xl text-amber-700 dark:text-amber-200">{inProgressCourses}</p>
              </div>
              <div className="rounded-[20px] bg-slate-100 px-4 py-3 font-semibold text-slate-600 dark:bg-slate-700/60 dark:text-slate-200">
                <p className="text-xs uppercase tracking-[0.25em]">Locked</p>
                <p className="mt-2 text-xl text-slate-700 dark:text-slate-100">{Math.max(totalCourses - completedCourses - inProgressCourses, 0)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
              <div className="h-full rounded-l-full bg-emerald-400" style={{ width: `${completedPercent}%` }} />
              <div className="h-full bg-amber-300" style={{ width: `${inProgressPercent}%` }} />
              <div className="h-full rounded-r-full bg-slate-300/80" style={{ width: `${lockedPercent}%` }} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-600 shadow-inner dark:bg-slate-800/60 dark:text-slate-300">🚀 8 progress</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-600 shadow-inner dark:bg-slate-800/60 dark:text-slate-300">🏆 6 badges unlocked</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-600 shadow-inner dark:bg-slate-800/60 dark:text-slate-300">📆 Weekly goal: 5 hrs</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Course roadmap</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Progress through curated foundations to unlock new realms.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/70 p-1 shadow-inner dark:bg-white/5">
              {years.map((year) => {
                const locked = year > unlockedYear;
                return (
                  <button
                    key={year}
                    onClick={() => !locked && setActiveYear(year)}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeYear === year
                        ? "bg-slate-900 text-white shadow-lg dark:bg-white/10"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                    } ${locked ? "pointer-events-none opacity-40" : ""}`}
                  >
                    <span>{locked ? "🔒" : "🟢"}</span>
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
              const status = locked ? "Locked" : completed ? "Completed" : started ? "In progress" : "Not started";
              const statusColor = locked
                ? "bg-slate-200 text-slate-500"
                : completed
                  ? "bg-emerald-100 text-emerald-700"
                  : started
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-600";
              const progressLabel = completed ? "100%" : started ? "55%" : "0%";

              return (
                <Link
                  key={course.id}
                  to={locked ? "#" : `/app/courses/${course.id}`}
                  className={`group relative overflow-hidden rounded-[28px] border border-white/60 bg-white/90 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(14,165,233,0.45)] dark:border-white/10 dark:bg-slate-900/60 ${
                    locked ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute -right-10 top-0 h-24 w-24 rounded-full bg-sky-200/40 blur-3xl" />
                  </div>
                  <div className="relative flex flex-col gap-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                          {courseEmojis[course.title] ?? "📘"} {course.title}
                        </span>
                        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">{course.description}</p>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusColor} dark:bg-opacity-20 dark:text-inherit`}>
                          {status === "Locked" ? "🔒" : status === "Completed" ? "✅" : status === "In progress" ? "⏳" : "🟡"}
                          {status}
                        </span>
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-sm font-semibold text-slate-700 shadow-inner transition group-hover:scale-105 dark:bg-slate-800/60 dark:text-slate-100">
                        {progressLabel}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-500 dark:text-slate-300">
                      <span>View details</span>
                      <span className="transition group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
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
                  className={`rounded-[20px] border border-white/60 bg-white/90 p-4 text-sm shadow-inner transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/50 ${
                    announcement.highlight ? "ring-2 ring-emerald-300/70 dark:ring-emerald-400/40" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                    <span className="text-xl">{announcement.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{announcement.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">{announcement.date}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{announcement.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick actions</h2>
            <div className="mt-4 space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={action.id}
                  to="#"
                  className={`flex items-center justify-between rounded-[20px] px-4 py-3 text-sm font-semibold transition ${
                    index === 0
                      ? "bg-slate-900 text-white shadow-lg hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/10"
                      : "bg-white/80 text-slate-700 shadow-inner hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-800/60 dark:text-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>{action.icon}</span>
                    {action.label}
                  </span>
                  <span>→</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Learning pulse</h2>
            <div className="mt-4 space-y-3">
              {learningPulse.map((pulse) => (
                <div
                  key={pulse.id}
                  className="rounded-[20px] border border-white/60 bg-white/90 p-4 text-sm shadow-inner transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-slate-900/50"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                    <span>{pulse.type === "event" ? "Upcoming" : pulse.type === "milestone" ? "Milestone" : "Reminder"}</span>
                    {pulse.action && (
                      <button className="rounded-full bg-slate-900 px-3 py-1 text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-700 dark:bg-white/10 dark:text-white">
                        {pulse.action}
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-900 dark:text-white">{pulse.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300">{pulse.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Learning goals</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-300">
              {learningGoals.map((goal) => (
                <li key={goal.id} className="flex items-center gap-3 rounded-[18px] bg-white/80 px-4 py-3 shadow-inner transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-800/60">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">✓</span>
                  {goal.label}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/95 p-6 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.25)] dark:border-slate-800/60 dark:bg-slate-900/70">
          <div className="pointer-events-none absolute -right-10 top-10 h-32 w-32 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Quest of the day</p>
            <blockquote className="mt-6 text-xl font-medium leading-relaxed text-slate-700 dark:text-slate-200">
              “{quote.text}”
            </blockquote>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">— {quote.author}</p>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/60 bg-white/95 p-6 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.25)] dark:border-slate-800/60 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Achievement showcase</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex flex-col gap-2 rounded-[24px] border border-white/60 p-4 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 ${
                  achievement.unlocked ? "bg-emerald-100/70 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100" : "bg-white/80 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-2xl">{achievement.icon}</span>
                  <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.25em] ${achievement.unlocked ? "bg-white/90 text-emerald-600 dark:bg-slate-900/60 dark:text-emerald-200" : "bg-slate-900 text-white dark:bg-white/10"}`}>
                    {achievement.unlocked ? "Unlocked" : "Locked"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{achievement.title}</p>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">{achievement.description}</p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{achievement.progressText}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
