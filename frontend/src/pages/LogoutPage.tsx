import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => {
      navigate("/landing", { replace: true });
    }, 4000);

    return () => clearTimeout(timer);
  }, [logout, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-editor-surface via-editor-panel to-editor-deep text-gray-200">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center shadow-xl shadow-emerald-500/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">✅</div>
          <h1 className="mt-6 text-3xl font-semibold text-white">You’re signed out</h1>
          <p className="mt-4 text-sm text-gray-200">
            See you soon! We’ve cleared your session for security. You’ll be redirected to the landing page shortly.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="w-full rounded-full bg-electric px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-electric/30 transition hover:bg-electric-light sm:w-auto"
            >
              Sign back in
            </Link>
            <Link
              to="/landing"
              className="w-full rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-gray-200 transition hover:border-electric-light hover:text-white sm:w-auto"
            >
              Explore Orus School
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LogoutPage;
