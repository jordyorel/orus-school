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
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-xl font-semibold text-slate-900">Orus School</div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <NavLink
              to="/app"
              className={({ isActive }) =>
                `rounded px-3 py-2 transition ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
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
                  `rounded px-3 py-2 transition ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                Admin
              </NavLink>
            ) : null}
            <button
              onClick={handleLogout}
              className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default ShellLayout;
