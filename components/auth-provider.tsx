"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface UserType {
  id: number
  name: string
  email: string
  phone: string | null
  address: string | null
  role: "admin" | "staff" | "viewer"
}

interface AuthContextType {
  user: UserType | null
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasPermission: (requiredRole: UserType["role"]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const roleHierarchy: Record<UserType["role"], number> = {
  admin: 3,
  staff: 2,
  viewer: 1,
}

const publicRoutes = ["/login", "/forgot-password"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isInitialized) {
      const storedUser = localStorage.getItem("user")
      const sessionExpiry = localStorage.getItem("sessionExpiry")

      if (storedUser && sessionExpiry) {
        try {
          const expiryTime = Number.parseInt(sessionExpiry)
          if (Date.now() < expiryTime) {
            setUser(JSON.parse(storedUser))
          } else {
            localStorage.removeItem("user")
            localStorage.removeItem("sessionExpiry")
          }
        } catch {
          localStorage.removeItem("user")
          localStorage.removeItem("sessionExpiry")
        }
      }

      setIsInitialized(true)
      setIsLoading(false)
    }
  }, [isInitialized])

  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user && !publicRoutes.includes(pathname)) {
        router.push("/login")
      } else if (user && pathname === "/login") {
        router.push("/")
      }
    }
  }, [user, pathname, isLoading, isInitialized, router])

  const login = async (email: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setIsLoading(false)
        return false
      }

      const data = await res.json()
      setUser(data.user)

      const expiryTime = Date.now() + (rememberMe ? 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000)
      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("sessionExpiry", expiryTime.toString())

      setIsLoading(false)
      return true
    } catch (error) {
      console.error(error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("sessionExpiry")
    router.push("/login")
  }

  const hasPermission = (requiredRole: UserType["role"]): boolean => {
    if (!user) return false
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
