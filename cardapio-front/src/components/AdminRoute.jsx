import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isGuest = localStorage.getItem("authMode") === "guest";
  const normalizedRole = (role || "").trim().toUpperCase();
  const isAdmin = normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN";

  if (!token || isGuest) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/refeicao" replace />;

  return children;
}
