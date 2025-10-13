type AvatarProps = {
  name: string;
  src?: string | null;
  className?: string;
};

const Avatar = ({ name, src, className }: AvatarProps) => {
  if (src) {
    return <img src={src} alt={name} className={`h-24 w-24 rounded-full object-cover shadow-lg ${className ?? ""}`} />;
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")
    .padEnd(2, "");

  return (
    <div
      className={`flex h-24 w-24 items-center justify-center rounded-full bg-electric/20 text-2xl font-semibold text-electric-light shadow-lg ${className ?? ""}`}
      aria-label={name}
    >
      {initials || name[0]?.toUpperCase() || "?"}
    </div>
  );
};

export default Avatar;
