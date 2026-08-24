import { useState, useEffect } from "react";
import { authService } from "../services/api";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkAuth() {
    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");

    if (!token) {
      try {
        await authService.refreshAccessToken();
      } catch {
        authService.clearAuthStorage();
        setUser(null);
        return false;
      }
    }

    try {
      const response = await authService.me();
      const usuario = response.data?.usuario || response.data;

      if (usuario) {
        localStorage.setItem("user", JSON.stringify(usuario));
        localStorage.setItem("role", usuario.role);
        setUser(usuario);
        return true;
      }
    } catch (err) {
      if (err.authRefreshFailed || err.response?.status === 401) {
        authService.clearAuthStorage();
        setUser(null);
        return false;
      }

      if (!saved) {
        setUser(null);
        return false;
      }
    }

    if (saved) {
      try {
        const usuario = JSON.parse(saved);
        setUser(usuario);
        return true;
      } catch {
        authService.clearAuthStorage();
        setUser(null);
      }
    }

    return false;
  }

  // Restaura sessão ao recarregar
  useEffect(() => {
    checkAuth();
  }, []);

  async function login(email, password) {
    setLoading(true);
    setError("");
    try {
      const response = await authService.login(email, password);
      const { accessToken, usuario } = response.data;

      if (!accessToken || !usuario) {
        throw new Error("Resposta de login inválida");
      }

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(usuario));
      localStorage.setItem("role", usuario.role);

      setUser(usuario);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro de conexão com servidor");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function registerAndLogin({ nome, email, password }) {
    setLoading(true);
    setError("");
    try {
      await authService.register({
        nome,
        email,
        senha: password,
      });

      const response = await authService.login(email, password);
      const { accessToken, usuario } = response.data;

      if (!accessToken || !usuario) {
        throw new Error("Resposta de login inválida");
      }

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(usuario));
      localStorage.setItem("role", usuario.role);

      setUser(usuario);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro de conexão com servidor");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  return { user, setUser, loading, error, login, logout, checkAuth, registerAndLogin };
}
