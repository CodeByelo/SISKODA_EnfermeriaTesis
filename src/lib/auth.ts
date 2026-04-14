import { API_URL } from "../config/api";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  personaId?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  tipo_miembro?: string | null;
  correo_institucional?: string | null;
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

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

export const authFetch = async (path: string, init: RequestInit = {}) => {
  const controller = new AbortController();
  const signal = init.signal ?? controller.signal;
  const timeoutId = !init.signal
    ? window.setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS)
    : null;

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal,
      headers: buildAuthHeaders(init.headers),
    });

    if (response.status === 401) {
      clearSession();
      window.location.href = "/";
    }

    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("La solicitud tardo demasiado en responder.");
    }

    throw error;
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
};

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cacheKey = (key: string) => `cache:${key}`;

export const getCachedJson = <T>(key: string): T | null => {
  const raw = sessionStorage.getItem(cacheKey(key));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;

    if (parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(cacheKey(key));
      return null;
    }

    return parsed.data;
  } catch {
    sessionStorage.removeItem(cacheKey(key));
    return null;
  }
};

export const setCachedJson = <T>(key: string, data: T, ttlMs = 60_000) => {
  const entry: CacheEntry<T> = {
    data,
    expiresAt: Date.now() + ttlMs,
  };

  sessionStorage.setItem(cacheKey(key), JSON.stringify(entry));
};
