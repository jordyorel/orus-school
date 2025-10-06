export type ProgressBarProps = {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<ProgressBarProps["size"]>, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4"
};

const ProgressBar = ({ value, label, size = "md" }: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div className="space-y-1">
      {label ? <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div> : null}
      <div className={`relative overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${sizeClasses[size]}`}>
        <div
          className="h-full w-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{Math.round(clamped)}%</div>
    </div>
  );
};

export default ProgressBar;
