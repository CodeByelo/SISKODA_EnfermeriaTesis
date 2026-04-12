/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  buildAuthHeaders,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
  type AuthUser,
} from "../lib/auth";
import { API_URL } from "../config/api";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const syncSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: buildAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error("Sesion invalida");
        }

        const nextUser = (await response.json()) as AuthUser;

        if (!cancelled) {
          setSession(token, nextUser);
          setUser(nextUser);
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setToken(null);
          setUser(null);
        }
      }
    };

    void syncSession();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login: (nextToken, nextUser) => {
        setSession(nextToken, nextUser);
        setToken(nextToken);
        setUser(nextUser);
      },
      logout: () => {
        clearSession();
        setToken(null);
        setUser(null);
      },
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
