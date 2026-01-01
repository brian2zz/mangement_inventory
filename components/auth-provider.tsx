"use client";

import { apiFetch } from "@/lib/api";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/* =======================
   TYPES
======================= */
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (role: string) => boolean;
};

/* =======================
   CONTEXT
======================= */
const AuthContext = createContext<AuthContextType | null>(null);

/* =======================
   PROVIDER
======================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* =======================
     LOGIN
  ======================= */
  const login = async (
    email: string,
    password: string,
    remember = false
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      // ✅ Gunakan endpoint relatif (baseURL sudah di axios)
      const res = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        console.error("❌ Login failed:", res.status);
        return false;
      }

      const data = await res.json();

      // ✅ SIMPAN TOKEN KE LOCALSTORAGE
      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem("token", data.token);
      }

      setUser(data.user);
      return true;
    } catch (err) {
      console.error("❌ Login error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
     LOGOUT
  ======================= */
  const logout = async () => {
    if (typeof window === "undefined") return;

    try {
      // ✅ Gunakan endpoint relatif
      await apiFetch("/logout", { method: "POST" });
    } catch (err) {
      console.error("❌ Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  /* =======================
     CHECK AUTH ON LOAD
  ======================= */
  const isPublicPage = () => {
    if (typeof window === "undefined") return true;
    return ["/login", "/forgot-password"].includes(
      window.location.pathname.replace(/\/$/, "")
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isPublicPage()) {
      setIsLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        // ✅ Gunakan endpoint relatif
        const res = await apiFetch("/me", { method: "GET" });

        // ✅ Handle 401 dengan benar
        if (res.status === 401) {
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        if (!res.ok) throw new Error("Auth failed");

        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /* =======================
     PERMISSION
  ======================= */
  const hasPermission = (role: string) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "staff") return role !== "admin";
    return role === "viewer";
  };

  /* =======================
     PROVIDER RENDER
  ======================= */
  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =======================
   HOOK
======================= */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}