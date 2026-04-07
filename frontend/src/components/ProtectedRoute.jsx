import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const userData = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  if (!userData || !token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles) {
    const user = JSON.parse(userData);
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
