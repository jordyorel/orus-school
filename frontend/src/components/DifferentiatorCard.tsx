interface DifferentiatorCardProps {
  icon: string;
  title: string;
  description: string;
}

const DifferentiatorCard = ({ icon, title, description }: DifferentiatorCardProps) => {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-charcoal/60 p-6 shadow-lg shadow-black/20 transition hover:border-electric">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-gray-400">{description}</p>
    </div>
  );
};

export default DifferentiatorCard;
