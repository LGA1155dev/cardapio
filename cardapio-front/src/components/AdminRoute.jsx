import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/api";

function isAdminRole(role) {
  const normalized = (role || "").trim().toUpperCase();
  return normalized === "ADMIN" || normalized === "ROLE_ADMIN";
}

export default function AdminRoute({ children }) {
  const [state, setState] = useState("loading");

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin() {
      if (localStorage.getItem("authMode") === "guest" || !localStorage.getItem("token")) {
        if (mounted) setState("login");
        return;
      }

      try {
        const response = await authService.me();
        const usuario = response.data?.usuario || response.data;
        authService.saveAuthData(localStorage.getItem("token"), usuario);

        if (mounted) {
          setState(isAdminRole(usuario?.role) ? "ok" : "forbidden");
        }
      } catch {
        if (mounted) setState("login");
      }
    }

    verifyAdmin();
    return () => {
      mounted = false;
    };
  }, []);

  if (state === "loading") return null;
  if (state === "login") return <Navigate to="/" replace />;
  if (state === "forbidden") return <Navigate to="/refeicao" replace />;

  return children;
}
