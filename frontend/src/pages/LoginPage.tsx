import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const dashboardHighlights = [
  "Continue your roadmap exactly where you left off",
  "Unlock the next challenge once exercises are validated",
  "Review mentor feedback and track achievements in real time",
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate("/landing", { replace: true });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-midnight via-[#050814] to-black text-gray-200">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
        <section className="w-full lg:w-1/2">
          <p className="text-sm uppercase tracking-[0.3em] text-electric-light">Welcome back</p>
          <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">Sign in to Orus School</h1>
          <p className="mt-6 text-base text-gray-300">
            Log in to pick up the Orus roadmap where you paused. Your dashboard orchestrates lessons, playground drills,
            and mentor notes exactly as outlined in the learning journey.
          </p>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-electric-light">Inside your dashboard</h2>
            <ul className="mt-4 space-y-4">
              {dashboardHighlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-electric" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl border border-electric/30 bg-electric/10 px-4 py-3 text-xs text-gray-300">
              Keep your streak alive: every completed challenge advances you toward the Week 8 project sprint highlighted
              in the roadmap.
            </div>
          </div>
        </section>
        <section className="w-full lg:w-1/2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/40">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-electric-light">Secure access</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Sign in to continue</h2>
              <p className="mt-3 text-sm text-gray-400">
                Enter your credentials to access your lessons, code playground, and community updates.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-400">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-black/50" />
                  Remember me
                </label>
                <a href="#reset" className="text-electric-light hover:text-electric">
                  Forgot password?
                </a>
              </div>
              {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-full bg-electric px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-10 text-center text-sm text-gray-400">
              New to Orus School?{" "}
              <Link to="/register" className="text-electric-light hover:text-electric">
                Get started today
              </Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
