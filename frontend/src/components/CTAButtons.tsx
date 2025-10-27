import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface CTAButtonsProps {
  primaryLabel: string;
  primaryTo: string;
  secondaryLabel: string;
  secondaryHref: string;
  authenticatedTo?: string;
}

const CTAButtons = ({ primaryLabel, primaryTo, secondaryLabel, secondaryHref, authenticatedTo }: CTAButtonsProps) => {
  const { student } = useAuth();
  const resolvedPrimaryTo = student && authenticatedTo ? authenticatedTo : primaryTo;

  return (
    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
      <Link
        to={resolvedPrimaryTo}
        className="inline-flex items-center justify-center rounded-full bg-electric px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light"
      >
        {primaryLabel}
      </Link>
      <a
        href={secondaryHref}
        className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-electric-light hover:text-white"
      >
        {secondaryLabel}
      </a>
    </div>
  );
};

export default CTAButtons;
