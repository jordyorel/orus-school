import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: JSX.Element;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-editor-surface via-editor-panel to-editor-deep text-gray-200">
        <p className="text-sm text-gray-300">Checking your session…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
