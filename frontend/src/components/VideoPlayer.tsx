type VideoPlayerProps = {
  url: string;
  title: string;
};

const VideoPlayer = ({ url, title }: VideoPlayerProps) => {
  return (
    <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm dark:border-slate-700">
      <iframe
        src={url}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer;
