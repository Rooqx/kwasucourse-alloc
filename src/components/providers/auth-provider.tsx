"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const AUTH_TOKEN_KEY = "kwasu_auth_token";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "HOD" | "LECTURER" | "STUDENT";
  level?: number | null;
  departmentId: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(currentToken
            ? { Authorization: `Bearer ${currentToken}` }
            : {}),
          ...options.headers,
        },
      });
    },
    []
  );

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
        return json.data;
      } else {
        // Token invalid — clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        return null;
      }
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setToken(newToken);
      const userData = await fetchUser(newToken);
      if (userData) {
        const rolePath = userData.role.toLowerCase();
        router.push(`/${rolePath}/dashboard`);
      }
    },
    [fetchUser, router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  // On mount: check localStorage for existing token
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, fetchWithAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
