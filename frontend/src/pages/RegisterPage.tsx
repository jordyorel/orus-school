import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const onboardingMilestones = [
  {
    title: "Week 0 — Orientation",
    description: "Meet your mentor, set up the Orus workspace, and explore the learning hub.",
  },
  {
    title: "Week 2 — C Fundamentals",
    description: "Master control flow, functions, and memory through daily code labs.",
  },
  {
    title: "Week 5 — Systems Thinking",
    description: "Dive into pointers, shell tools, and debugging strategies with guided challenges.",
  },
  {
    title: "Week 8 — Orus Project Sprint",
    description: "Collaborate on a portfolio-ready project with code reviews and live feedback.",
  },
];

const valueBullets = [
  "Interactive lessons with instant playground feedback",
  "Structured roadmap grounded in real engineering sprints",
  "Mentor-led check-ins and accountability rituals",
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cohort, setCohort] = useState("january");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate("/login", { replace: true });
    } catch (err) {
      setError("We couldn’t submit your enrollment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-[#030512] to-midnight text-gray-200">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-16 sm:px-6 lg:flex-row lg:gap-20 lg:py-24">
        <section className="w-full lg:w-1/2">
          <p className="text-sm uppercase tracking-[0.3em] text-electric-light">Get started</p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
            Join the next Orus cohort and transform the way you learn to code.
          </h1>
          <p className="mt-6 text-base text-gray-300">
            We built Orus School to mirror how modern software teams actually work. From your first login, you’ll
            progress through a curated roadmap of lessons, live challenges, and project reviews that follow the
            Learn → Practice → Grow philosophy.
          </p>
          <div className="mt-8 space-y-4">
            {valueBullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-electric" />
                <p className="text-sm text-gray-300">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Your first 8 weeks at a glance</h2>
            <p className="mt-2 text-sm text-gray-400">
              Every cohort follows the same playbook outlined in the Orus roadmap. Here’s how the first milestones
              unfold once you enroll.
            </p>
            <ul className="mt-6 space-y-5">
              {onboardingMilestones.map((milestone) => (
                <li key={milestone.title} className="border-l-2 border-electric/40 pl-4">
                  <p className="text-sm font-semibold text-electric-light">{milestone.title}</p>
                  <p className="mt-1 text-sm text-gray-300">{milestone.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="w-full lg:w-1/2">
          <div className="rounded-3xl border border-white/10 bg-black/50 p-10 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-electric-light">Enrollment form</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Secure your seat</h2>
              <p className="mt-3 text-sm text-gray-400">
                Share a few details and we’ll send you the onboarding kit with access to the learning hub.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/50"
                  placeholder="Ada Lovelace"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/50"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/50"
                  placeholder="Create a strong password"
                />
              </div>
              <div>
                <label htmlFor="cohort" className="block text-sm font-medium text-gray-300">
                  Choose your cohort
                </label>
                <select
                  id="cohort"
                  value={cohort}
                  onChange={(event) => setCohort(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-electric focus:outline-none focus:ring-2 focus:ring-electric/50"
                >
                  <option value="january">January 2025</option>
                  <option value="march">March 2025</option>
                  <option value="may">May 2025</option>
                </select>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs text-gray-400">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-electric" />
                <p>
                  By clicking "Get started", you agree to follow the Orus honor code: stay curious, support your peers, and ship
                  your project sprint by Week 8.
                </p>
              </div>
              {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-electric px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Submitting…" : "Get started"}
              </button>
            </form>
            <p className="mt-10 text-center text-sm text-gray-400">
              Already part of Orus?{" "}
              <Link to="/login" className="text-electric-light hover:text-electric">
                Sign in instead
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RegisterPage;
