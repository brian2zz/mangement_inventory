"use client";

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
   API URL HELPER
======================= */
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (!url) {
    console.error("❌ NEXT_PUBLIC_API_URL is NOT defined");
    return null;
  }

  return url.replace(/\/$/, "");
};

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
    const apiUrl = getApiUrl();
    if (!apiUrl) return false;

    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        console.error("❌ Login failed:", res.status);
        return false;
      }

      const data = await res.json();

      if (typeof window !== "undefined") {
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
    const apiUrl = getApiUrl();
    if (!apiUrl || typeof window === "undefined") return;

    try {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch(`${apiUrl}/logout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
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

    const apiUrl = getApiUrl();
    if (!apiUrl) {
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
        const res = await fetch(`${apiUrl}/me`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // 🔴 HANDLE 401 DENGAN BENAR
        if (res.status === 401) {
          localStorage.removeItem("token");
          return;
        }

        if (!res.ok) throw new Error("Auth failed");

        const userData = await res.json();
        setUser(userData);
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        localStorage.removeItem("token");
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
