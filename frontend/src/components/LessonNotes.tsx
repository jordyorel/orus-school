type LessonNotesProps = {
  content: string;
};

const LessonNotes = ({ content }: LessonNotesProps) => {
  return (
    <article className="prose prose-slate max-w-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:prose-invert dark:border-slate-700 dark:bg-slate-900">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
};

export default LessonNotes;
