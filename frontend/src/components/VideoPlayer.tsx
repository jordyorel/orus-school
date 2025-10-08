type VideoPlayerProps = {
  url: string;
  title: string;
  watched?: boolean;
  onWatched?: () => void;
};

const VideoPlayer = ({ url, title, watched, onWatched }: VideoPlayerProps) => {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm dark:border-slate-700">
      <iframe
        src={url}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      {onWatched ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-black/60 to-transparent p-3">
          <button
            type="button"
            onClick={onWatched}
            disabled={watched}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/50"
          >
            {watched ? "Watched" : "Mark as watched"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default VideoPlayer;
