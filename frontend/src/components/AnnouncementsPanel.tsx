export type Announcement = {
  id: number | string;
  title: string;
  description: string;
  date: string;
  icon?: string;
  highlight?: boolean;
};

type AnnouncementsPanelProps = {
  announcements: Announcement[];
};

const AnnouncementsPanel = ({ announcements }: AnnouncementsPanelProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Announcements</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Stay in the loop
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {announcements.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border border-transparent p-4 transition ${
              item.highlight
                ? "bg-indigo-50 text-indigo-900 shadow-inner dark:bg-indigo-500/10 dark:text-indigo-100"
                : "bg-slate-50 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {item.icon ? <span>{item.icon}</span> : null}
                  <span>{item.title}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.date}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AnnouncementsPanel;
