"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/components/auth-provider";
import { useEffect } from "react";

const publicRoutes = ["/login", "/forgot-password"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const cleanPath = pathname.replace(/\/$/, "");
  const isPublicRoute = publicRoutes.includes(cleanPath);

  /* HOOK HARUS DI ATAS */
  useEffect(() => {
    if (!isPublicRoute && !isLoading && !user) {
      window.location.href = "/login";
    }
  }, [isPublicRoute, isLoading, user]);

  /* =========================
     1. PUBLIC ROUTE
     ========================= */
  if (isPublicRoute) {
    return <>{children}</>;
  }

  /* =========================
     2. LOADING
     ========================= */
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="enhanced-card p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            <span className="text-slate-600 font-medium">Memuat sistem...</span>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     3. BELUM LOGIN
     ========================= */
  if (!user) {
    return null;
  }

  /* =========================
     4. AUTHENTICATED LAYOUT
     ========================= */
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen flex flex-col bg-transparent">
        {/* STICKY TOP NAVBAR */}
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 gradient-header px-4 sm:px-6">
          <SidebarTrigger className="-ml-1 hover:bg-pink-100/60 text-slate-700 transition-all duration-300 rounded-lg p-1.5" />
          
          <div className="flex items-center gap-2 flex-1">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Inventra
            </h1>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-400 border-l border-pink-200 pl-2.5">
              Management Inventory
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-700 block">{user.name}</span>
              <span className="text-[11px] font-medium text-pink-500 capitalize block">{user.role || "Staff"}</span>
            </div>
            
            <div className="w-9 h-9 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-md shadow-pink-400/20 ring-2 ring-white">
              <span className="text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
