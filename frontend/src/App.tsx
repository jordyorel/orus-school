import { Navigate, Route, Routes } from "react-router-dom";
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
    <main className="flex min-h-screen flex-col">
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
      <Route path="courses/:courseId/lesson/:lessonId" element={<CoursePage />} />
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
