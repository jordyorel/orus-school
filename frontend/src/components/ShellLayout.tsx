import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context";

const ShellLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 transition-colors dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-semibold text-slate-900 transition-colors dark:text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-lg font-bold text-white shadow-soft">
              O
            </span>
            <span>Orus School</span>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600 transition-colors dark:text-slate-300">
            <NavLink
              to="/app"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-soft dark:bg-white/10 dark:text-white"
                    : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                }`
              }
              end
            >
              Dashboard
            </NavLink>
            {user?.role === "admin" ? (
              <NavLink
                to="/app/admin"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-soft dark:bg-white/10 dark:text-white"
                      : "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
                  }`
                }
              >
                Admin
              </NavLink>
            ) : null}
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ShellLayout;
