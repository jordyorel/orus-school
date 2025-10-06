export type LessonStatus = "completed" | "in_progress" | "locked";

export type CurriculumItemKind = "module" | "lesson" | "project" | "topic" | "exercise";

export type CurriculumItem = {
  id?: number;
  title: string;
  status?: LessonStatus;
  kind: CurriculumItemKind;
  meta?: string;
  items?: CurriculumItem[];
  disabled?: boolean;
  lessonId?: number;
};

export type CurriculumSection = {
  id: string;
  title: string;
  subtitle?: string;
  items: CurriculumItem[];
};

export type CurriculumLessonItem = CurriculumItem & { id: number; kind: "lesson" };

export type CurriculumExerciseItem = CurriculumItem & {
  id: number;
  kind: "exercise";
  lessonId: number;
};

type CourseSidebarProps = {
  curriculumSections: CurriculumSection[];
  activeLessonId: number | null;
  activeExerciseId: number | null;
  onLessonSelect: (lesson: CurriculumLessonItem) => void;
  onExerciseSelect?: (exercise: CurriculumExerciseItem) => void;
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
  props: {
    activeLessonId: number | null;
    activeExerciseId: number | null;
    onLessonSelect: (lesson: CurriculumLessonItem) => void;
    onExerciseSelect?: (exercise: CurriculumExerciseItem) => void;
  },
  parentLessonId?: number
) => {
  const key =
    typeof node.id === "number"
      ? `${node.kind}-${node.id}`
      : `${node.kind}-${node.title}-${depth}-${parentLessonId ?? "root"}`;
  const hasChildren = (node.items?.length ?? 0) > 0;
  const isLesson = node.kind === "lesson" && typeof node.id === "number";
  const isExercise = node.kind === "exercise" && typeof node.id === "number";
  const status = node.status;

  const effectiveLessonId = isLesson
    ? node.id
    : isExercise
    ? node.lessonId ?? parentLessonId
    : parentLessonId;

  const isActiveLesson = isLesson && node.id === props.activeLessonId;
  const isActiveExercise = isExercise && node.id === props.activeExerciseId;

  const disabled =
    node.disabled ||
    status === "locked" ||
    (!isLesson && !isExercise) ||
    (isExercise && (effectiveLessonId === undefined || props.onExerciseSelect === undefined));

  const baseClasses =
    "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500";

  const activeLessonClasses =
    "border-sky-400 bg-sky-50 shadow-sm dark:border-sky-500/70 dark:bg-sky-500/10";
  const activeExerciseClasses =
    "border-emerald-400 bg-emerald-500/10 text-emerald-700 shadow-sm dark:border-emerald-400/70 dark:bg-emerald-500/10 dark:text-emerald-200";
  const inactiveClasses =
    "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900";
  const staticClasses =
    "border-dashed border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/40";

  const containerClasses =
    isLesson || isExercise
      ? `${baseClasses} ${
          isActiveLesson || isActiveExercise
            ? isActiveExercise
              ? activeExerciseClasses
              : activeLessonClasses
            : inactiveClasses
        }`
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
        <div
          className={`truncate text-sm font-semibold ${
            isActiveExercise ? "text-emerald-700 dark:text-emerald-200" : "text-slate-900 dark:text-white"
          }`}
        >
          {node.title}
        </div>
      </div>
      {status ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            statusStyles[status].badge
          }`}
        >
          <span aria-hidden="true">{statusStyles[status].icon}</span>
          <span>{statusStyles[status].label}</span>
        </span>
      ) : null}
    </>
  );

  const handleClick = () => {
    if (disabled) return;
    if (isLesson) {
      props.onLessonSelect({ ...(node as CurriculumLessonItem) });
      return;
    }
    if (isExercise && props.onExerciseSelect && typeof node.id === "number" && effectiveLessonId !== undefined) {
      props.onExerciseSelect({ ...(node as CurriculumExerciseItem), lessonId: effectiveLessonId });
    }
  };

  return (
    <div key={key} className="space-y-2">
      {isLesson || isExercise ? (
        <button type="button" onClick={handleClick} disabled={disabled} {...sharedProps}>
          {content}
        </button>
      ) : (
        <div {...sharedProps}>{content}</div>
      )}
      {hasChildren ? (
        <div className="space-y-1">
          {node.items!.map((child) =>
            renderNode(child, depth + 1, props, isLesson ? (typeof node.id === "number" ? node.id : parentLessonId) : effectiveLessonId)
          )}
        </div>
      ) : null}
    </div>
  );
};

const CourseSidebar = ({
  curriculumSections,
  activeLessonId,
  activeExerciseId,
  onLessonSelect,
  onExerciseSelect
}: CourseSidebarProps) => {
  return (
    <nav className="space-y-5" aria-label="Course navigation">
      {curriculumSections.map((section) => (
        <details
          key={section.id}
          className="group space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm open:bg-white dark:border-slate-700 dark:bg-slate-900"
          open
        >
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
            {section.items.map((item) =>
              renderNode(item, 1, { activeLessonId, activeExerciseId, onLessonSelect, onExerciseSelect })
            )}
          </div>
        </details>
      ))}
    </nav>
  );
};

export default CourseSidebar;
