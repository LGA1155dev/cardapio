import { useState, useEffect } from "react";
import { authService } from "../services/api";

const getAuthErrorMessage = (err, fallback = "Erro de conexão com servidor") => (
  err.response?.data?.message ||
  err.response?.data?.error ||
  err.message ||
  fallback
);

const isUserNotFoundError = (err) => err.response?.status === 404;

const buildDefaultName = (email) => {
  const prefix = String(email || "").split("@")[0].trim();
  return prefix || "Usuário";
};

export function useAuth({ autoCheck = true } = {}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkAuth() {
    if (authService.isGuest()) {
      setUser(null);
      return false;
    }

    const token = localStorage.getItem("token");
    const saved = localStorage.getItem("user");

    if (!token) {
      if (!saved) {
        setUser(null);
        return false;
      }

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
        authService.saveAuthData(localStorage.getItem("token") || token, usuario);
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
    if (!autoCheck) return undefined;

    let mounted = true;
    setLoading(true);

    checkAuth().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [autoCheck]);

  async function login(email, password) {
    setLoading(true);
    setError("");
    try {
      const usuario = await authenticate(email, password);
      setUser(usuario);
      return true;
    } catch (err) {
      setError(getAuthErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function loginOrRegister(email, password) {
    setLoading(true);
    setError("");

    try {
      try {
        const usuario = await authenticate(email, password);
        setUser(usuario);
        return true;
      } catch (loginError) {
        if (!isUserNotFoundError(loginError)) {
          throw loginError;
        }
      }

      if (password.length < 6) {
        throw new Error("Use pelo menos 6 caracteres.");
      }

      await authService.register({
        nome: buildDefaultName(email),
        email,
        senha: password,
      });

      const usuario = await authenticate(email, password);
      setUser(usuario);
      return true;
    } catch (err) {
      setError(getAuthErrorMessage(err));
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

      const usuario = await authenticate(email, password);
      setUser(usuario);
      return true;
    } catch (err) {
      setError(getAuthErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  async function authenticate(email, password) {
    const response = await authService.login(email, password);
    const { accessToken, usuario } = response.data;

    if (!accessToken || !usuario) {
      throw new Error("Resposta de login inválida");
    }

    authService.saveAuthData(accessToken, usuario);
    return usuario;
  }

  return { user, setUser, loading, error, login, loginOrRegister, logout, checkAuth, registerAndLogin };
}
