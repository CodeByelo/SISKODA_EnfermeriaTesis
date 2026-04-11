import { API_URL } from "../config/api";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

export const TOKEN_KEY = "token";
export const USER_KEY = "auth_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setSession = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => Boolean(getToken());

export const buildAuthHeaders = (headers: HeadersInit = {}) => {
  const token = getToken();
  const normalized = new Headers(headers);

  if (token) {
    normalized.set("Authorization", `Bearer ${token}`);
  }

  return normalized;
};

export const authFetch = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: buildAuthHeaders(init.headers),
  });

  if (response.status === 401) {
    clearSession();
    window.location.href = "/";
  }

  return response;
};
