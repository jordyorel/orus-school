import { useEffect, useRef } from "react";

type VideoPlayerProps = {
  url: string;
  title: string;
  watched?: boolean;
  onWatched?: () => void;
  onProgress?: (ratio: number) => void;
};

const WATCH_THRESHOLD = 0.9;

const clampProgress = (value: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

const resolveSource = (input: string): string => {
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  try {
    return new URL(input, base).toString();
  } catch {
    return input;
  }
};

const VideoPlayer = ({ url, title, watched = false, onWatched, onProgress }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef<boolean>(watched);
  const resolvedSrc = resolveSource(url);

  useEffect(() => {
    completedRef.current = watched;
    if (watched) {
      onProgress?.(1);
    }
  }, [watched, onProgress, url]);

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video) return;
    const { duration, currentTime } = video;
    if (!duration || Number.isNaN(duration)) {
      return;
    }
    const ratio = clampProgress(currentTime / duration);
    onProgress?.(ratio);
    if (!completedRef.current && ratio >= WATCH_THRESHOLD) {
      completedRef.current = true;
      onWatched?.();
      onProgress?.(1);
    }
  };

  const handleEnded = () => {
    onProgress?.(1);
    if (!completedRef.current) {
      completedRef.current = true;
      onWatched?.();
    }
  };

  const handleLoadedMetadata = () => {
    if (watched) {
      onProgress?.(1);
    } else {
      onProgress?.(0);
    }
  };

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm dark:border-slate-700">
      <video
        key={resolvedSrc}
        ref={videoRef}
        className="h-full w-full"
        controls
        title={title}
        aria-label={title}
        playsInline
        preload="metadata"
        onTimeUpdate={handleProgress}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
      >
        <source src={resolvedSrc} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
