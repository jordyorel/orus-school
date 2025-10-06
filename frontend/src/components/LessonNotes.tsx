type LessonNotesProps = {
  content: string;
};

const LessonNotes = ({ content }: LessonNotesProps) => {
  return (
    <article className="prose prose-slate max-w-none rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg backdrop-blur transition-colors dark:prose-invert dark:border-slate-700 dark:bg-slate-900/70">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
};

export default LessonNotes;
