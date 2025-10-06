type InstructionPanelProps = {
  title: string;
  instructions: string;
};

const InstructionPanel = ({ title, instructions }: InstructionPanelProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: instructions }} />
    </section>
  );
};

export default InstructionPanel;
