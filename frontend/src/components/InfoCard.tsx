type InfoCardProps = {
  label: string;
  value: string;
};

const InfoCard = ({ label, value }: InfoCardProps) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20">
    <p className="text-xs uppercase tracking-[0.3em] text-electric-light">{label}</p>
    <p className="mt-2 text-lg font-semibold text-white">{value}</p>
  </div>
);

export default InfoCard;
