"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (role: string) => boolean; // ✅ TAMBAHKAN
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔐 LOGIN
  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) return false;

      const data = await res.json();

      // simpan token
      localStorage.setItem("token", data.token);

      setUser(data.user);
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 🔓 LOGOUT
  const logout = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
    }

    localStorage.removeItem("token");
    setUser(null);
  };

  const hasPermission = (role: string) => {
    if (!user) return false;

    // admin bisa akses semua
    if (user.role === "admin") return true;

    // staff bisa akses staff + viewer
    if (user.role === "staff") {
      return role === "staff" || role === "viewer";
    }

    // viewer hanya viewer
    if (user.role === "viewer") {
      return role === "viewer";
    }

    return false;
  };

  // 🔁 AUTO LOGIN (refresh page)
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch(`${API_URL}/me`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user) setUser(user);
        else localStorage.removeItem("token");
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setIsLoading(false)); // ⬅️ PENTING
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
