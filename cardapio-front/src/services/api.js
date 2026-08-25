import axios from "axios";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const ROLE_KEY = "role";
const AUTH_MODE_KEY = "authMode";
const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8081" : "")).trim().replace(/\/+$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(AUTH_MODE_KEY);
}

function saveAuthData(accessToken, usuario) {
  localStorage.removeItem(AUTH_MODE_KEY);

  if (accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
  }

  if (usuario) {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    localStorage.setItem(ROLE_KEY, usuario.role);
  }
}

let refreshRequest = null;

export async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_BASE_URL}/usuarios/refresh`, null, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        const { accessToken, usuario } = response.data;

        if (!accessToken) {
          throw new Error("Resposta de refresh inválida");
        }

        saveAuthData(accessToken, usuario);
        return accessToken;
      })
      .catch((error) => {
        error.authRefreshFailed = true;
        clearAuthStorage();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      url.includes("/usuarios/login") ||
      url.includes("/usuarios/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshError.authRefreshFailed = true;
      clearAuthStorage();

      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.replace("/");
      }

      return Promise.reject(refreshError);
    }
  }
);

export const authService = {
  saveAuthData,

  login(email, senha) {
    return api.post("/usuarios/login", {
      email,
      senha,
    });
  },

  register(usuario) {
    return api.post("/usuarios", usuario);
  },

  me() {
    return api.get("/usuarios/me");
  },

  enterGuest() {
    clearAuthStorage();
    localStorage.setItem(AUTH_MODE_KEY, "guest");
  },

  isGuest() {
    return localStorage.getItem(AUTH_MODE_KEY) === "guest";
  },

  async logout() {
    try {
      await api.post("/usuarios/logout");
    } catch (error) {
      if (error.response?.status && error.response.status !== 404) {
        console.warn("Logout remoto não concluído:", error);
      }
    } finally {
      clearAuthStorage();
    }
  },

  clearAuthStorage,
  refreshAccessToken,
};
