export type CourseCardProps = {
  title: string;
  description: string;
  status: "completed" | "in_progress" | "locked";
  completion: number;
  onClick?: () => void;
  yearLabel: string;
};

const statusStyles: Record<CourseCardProps["status"], string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  locked: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
};

const statusLabel: Record<CourseCardProps["status"], string> = {
  completed: "Completed",
  in_progress: "In progress",
  locked: "Locked"
};

const CourseCard = ({ title, description, status, completion, onClick, yearLabel }: CourseCardProps) => {
  const disabled = status === "locked";
  const clampedCompletion = Math.max(0, Math.min(100, completion));
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          {yearLabel}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {statusLabel[status]}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 transition group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Progress</span>
          <span>{Math.round(clampedCompletion)}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400"
            style={{ width: `${clampedCompletion}%` }}
          />
        </div>
      </div>
    </button>
  );
};

export default CourseCard;
