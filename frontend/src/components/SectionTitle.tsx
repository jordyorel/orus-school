interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

const SectionTitle = ({ eyebrow, title, description, align = "left" }: SectionTitleProps) => {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="text-sm uppercase tracking-[0.2em] text-electric-light">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base text-gray-400">{description}</p>}
    </div>
  );
};

export default SectionTitle;
