"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"

const publicRoutes = ["/login", "/forgot-password"]

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="enhanced-card p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // If it's a public route (login, forgot password), don't show sidebar
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // If user is not authenticated and not on public route, show login
  if (!user) {
    return <>{children}</>
  }

  // Show admin layout with sidebar for authenticated users
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 gradient-header px-4">
          <SidebarTrigger className="-ml-1 hover:bg-white/20 transition-all duration-300" />
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Inventory Management System
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Welcome, {user.name}</span>
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
