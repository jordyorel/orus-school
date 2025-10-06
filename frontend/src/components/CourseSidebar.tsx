export type LessonStatus = "completed" | "in_progress" | "locked";

export type CurriculumItemKind = "module" | "lesson" | "project" | "topic";

export type CurriculumItem = {
  id?: number;
  title: string;
  status?: LessonStatus;
  kind: CurriculumItemKind;
  meta?: string;
  items?: CurriculumItem[];
  disabled?: boolean;
};

export type CurriculumSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: CurriculumItem[];
};

type CourseSidebarProps = {
  sections: CurriculumSection[];
  activeLessonId: number | null;
  onSelect: (lessonId: number) => void;
};

const statusStyles: Record<LessonStatus, { badge: string; label: string; icon: string }> = {
  completed: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    label: "Completed",
    icon: "✅"
  },
  in_progress: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    label: "In progress",
    icon: "⏳"
  },
  locked: {
    badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
    label: "Locked",
    icon: "🔒"
  }
};

const renderNode = (
  node: CurriculumItem,
  depth: number,
  activeLessonId: number | null,
  onSelect: (lessonId: number) => void
) => {
  const key = typeof node.id === "number" ? `lesson-${node.id}` : `${node.kind}-${node.title}-${depth}`;
  const hasChildren = (node.items?.length ?? 0) > 0;
  const isLesson = node.kind === "lesson" && typeof node.id === "number";
  const isActive = isLesson && node.id === activeLessonId;
  const status = node.status;
  const disabled = node.disabled || status === "locked" || !isLesson;

  const baseClasses =
    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";

  const activeClasses =
    "border-sky-400 bg-sky-50 shadow-sm dark:border-sky-500/70 dark:bg-sky-500/10";
  const inactiveClasses =
    "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900";
  const staticClasses =
    "border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40";

  const containerClasses = isLesson
    ? `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
    : `${baseClasses} ${staticClasses}`;

  const sharedProps = {
    className: `${containerClasses} ${disabled ? "disabled:cursor-not-allowed disabled:opacity-60" : ""}`,
    style: { paddingLeft: depth * 12 }
  } as const;

  const content = (
    <>
      <div className="min-w-0 space-y-1">
        {node.meta ? (
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {node.meta}
          </div>
        ) : null}
        <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{node.title}</div>
      </div>
      {status ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[status].badge}`}
        >
          <span aria-hidden="true">{statusStyles[status].icon}</span>
          <span>{statusStyles[status].label}</span>
        </span>
      ) : null}
    </>
  );

  return (
    <div key={key} className="space-y-2">
      {isLesson ? (
        <button
          type="button"
          onClick={() => (disabled || typeof node.id !== "number" ? undefined : onSelect(node.id))}
          disabled={disabled}
          {...sharedProps}
        >
          {content}
        </button>
      ) : (
        <div {...sharedProps}>{content}</div>
      )}
      {hasChildren ? (
        <div className="space-y-1">
          {node.items!.map((child) => renderNode(child, depth + 1, activeLessonId, onSelect))}
        </div>
      ) : null}
    </div>
  );
};

const CourseSidebar = ({ sections, activeLessonId, onSelect }: CourseSidebarProps) => {
  return (
    <nav className="space-y-5" aria-label="Course navigation">
      {sections.map((section) => (
        <details key={section.id} className="group space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm open:bg-white dark:border-slate-700 dark:bg-slate-900" open>
          <summary className="cursor-pointer list-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {section.title}
                </h2>
                {section.subtitle ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{section.subtitle}</p>
                ) : null}
              </div>
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs text-slate-400 transition group-open:rotate-180 dark:border-slate-700">
                ▾
              </span>
            </div>
          </summary>
          <div className="space-y-2">
            {section.items.map((item) => renderNode(item, 1, activeLessonId, onSelect))}
          </div>
        </details>
      ))}
    </nav>
  );
};

export default CourseSidebar;
