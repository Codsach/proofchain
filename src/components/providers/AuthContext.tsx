"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "investigator" | "analyst" | "admin";
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Access token lives in memory only — never localStorage or a cookie
  const accessTokenRef = useRef<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ── Refresh: exchange httpOnly refresh cookie for a new access token ───────
  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;

      const data = await res.json();
      accessTokenRef.current = data.accessToken;
      setUser(data.user);
      return data.accessToken;
    } catch {
      return null;
    }
  }, []);

  // ── On mount: restore session silently ────────────────────────────────────
  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  // ── getToken: returns valid token, auto-refreshing if expired ─────────────
  const getToken = useCallback(async (): Promise<string | null> => {
    if (accessTokenRef.current) return accessTokenRef.current;
    return refresh();
  }, [refresh]);

  // ── Login ─────────────────────────────────────────────────────────────────
  // Only sends email + password. Role and redirect come from the server.
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
        // NOTE: we send ONLY email + password — no role field
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: "Unexpected server response" };
      }

      if (!res.ok) {
        throw new Error(data.error || `Login failed (${res.status})`);
      }

      // Store token in memory
      accessTokenRef.current = data.accessToken;
      setUser(data.user);

      // Follow the redirect path the server computed from the DB role
      // The frontend never decides where to go — it just follows the server
      router.push(data.redirectTo);
    },
    [router]
  );

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: accessTokenRef.current
          ? { Authorization: `Bearer ${accessTokenRef.current}` }
          : {},
        credentials: "include",
      });
    } catch {
      // Continue logout even if request fails
    }

    accessTokenRef.current = null;
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}