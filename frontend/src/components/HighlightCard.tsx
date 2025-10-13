interface HighlightCardProps {
  title: string;
  description: string;
}

const HighlightCard = ({ title, description }: HighlightCardProps) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-electric hover:bg-electric/10">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  );
};

export default HighlightCard;
