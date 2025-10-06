type InstructionPanelProps = {
  title: string;
  instructions: string;
};

const InstructionPanel = ({ title, instructions }: InstructionPanelProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          <span aria-hidden="true">📘</span>
          Instructions
        </span>
      </div>
      <div
        className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: instructions }}
      />
    </section>
  );
};

export default InstructionPanel;
