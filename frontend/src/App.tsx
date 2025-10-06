import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CoursePage from "./pages/CoursePage";
import AdminPage from "./pages/AdminPage";
import LandingPage from "./pages/LandingPage";
import ShellLayout from "./components/ShellLayout";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-lg bg-white p-8 shadow">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }
  return children;
};

const PlaygroundWrapper = () => (
  <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900 transition-colors dark:text-white">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 text-lg font-bold text-white shadow-soft">
            O
          </span>
          <span>Orus School</span>
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 transition-colors dark:text-slate-300">
          <Link
            to="/"
            className="rounded-full px-4 py-2 transition-all hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Back to site
          </Link>
          <Link
            to="/login"
            className="rounded-full bg-slate-900 px-4 py-2 text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <CoursePage />
    </main>
  </div>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/playground" element={<PlaygroundWrapper />} />
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <ShellLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="courses/:courseId" element={<CoursePage />} />
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
