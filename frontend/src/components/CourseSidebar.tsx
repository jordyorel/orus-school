export type LessonStatus = "completed" | "in_progress" | "locked";

export type LessonSidebarItem = {
  id: number;
  title: string;
  status: LessonStatus;
};

type CourseSidebarProps = {
  lessons: LessonSidebarItem[];
  activeLessonId: number | null;
  onSelect: (lessonId: number) => void;
};

const badgeStyles: Record<LessonStatus, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  locked: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
};

const CourseSidebar = ({ lessons, activeLessonId, onSelect }: CourseSidebarProps) => {
  return (
    <nav className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Course roadmap
      </h2>
      <div className="space-y-2">
        {lessons.map((lesson) => {
          const isActive = lesson.id === activeLessonId;
          const disabled = lesson.status === "locked";
          return (
            <button
              key={lesson.id}
              onClick={() => onSelect(lesson.id)}
              disabled={disabled}
              className={`w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "border-sky-400 bg-sky-50 shadow-sm dark:border-sky-500/70 dark:bg-sky-500/10"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</span>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles[lesson.status]}`}>
                  {lesson.status === "completed" ? "Done" : lesson.status === "locked" ? "Locked" : "Active"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CourseSidebar;
