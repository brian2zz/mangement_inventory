"use client"

import {
  Building2,
  FileText,
  Home,
  Package,
  PackageMinus,
  PackagePlus,
  ShoppingCart,
  Tags,
  TrendingDown,
  TrendingUp,
  Users,
  Users2,
  LogOut,
  User,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/auth-provider"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
  },
  {
    title: "Inventory Adjustments",
    url: "/adjustment",
    icon: SlidersHorizontal,
  },
  {
    title: "Product Categories",
    url: "/categories",
    icon: Tags,
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Building2,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users2,
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
  },
]

const transactionItems = [
  {
    title: "Incoming Products",
    url: "/incoming",
    icon: PackagePlus,
  },
  {
    title: "Outgoing Products",
    url: "/outgoing",
    icon: PackageMinus,
  },
  {
    title: "Product Requests",
    url: "/requests",
    icon: ShoppingCart,
  },
]

const reportItems = [
  {
    title: "Incoming Product Report",
    url: "/reports/incoming",
    icon: TrendingUp,
  },
  {
    title: "Outgoing Product Report",
    url: "/reports/outgoing",
    icon: TrendingDown,
  },
  {
    title: "Request Report",
    url: "/reports/requests",
    icon: FileText,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout, hasPermission } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()

  // Normalisasi pathname: hilangkan trailing slash agar "/categories/" cocok dengan "/categories"
  const normalizedPath = pathname ? pathname.replace(/\/+$/, "") || "/" : "/"

  const isItemActive = (url: string) => {
    const cleanUrl = url.replace(/\/+$/, "") || "/"
    if (cleanUrl === "/") {
      return normalizedPath === "/"
    }
    return normalizedPath === cleanUrl || normalizedPath.startsWith(`${cleanUrl}/`)
  }

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.url === "/users") return hasPermission("admin")
    return true
  })

  const filteredTransactionItems = transactionItems.filter((item) => {
    if (!hasPermission("staff")) return false
    return true
  })

  return (
    <Sidebar className="gradient-sidebar border-r-0 shadow-xl shadow-pink-500/5">
      {/* Brand Header */}
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
          <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-wide block leading-none">
              INVENTRA
            </span>
            <span className="text-[10px] text-white/70 font-medium tracking-widest uppercase">
              Workspace
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent px-2">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 font-semibold text-[11px] uppercase tracking-wider mb-1.5 px-3">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {filteredMenuItems.map((item) => {
                const active = isItemActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`group transition-all duration-300 rounded-2xl px-3 py-2.5 relative overflow-hidden font-medium text-sm ${
                        active
                          ? "bg-white text-pink-600 shadow-md shadow-pink-900/10 font-bold"
                          : "text-white/80 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      <Link
                        href={item.url}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <item.icon
                          className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                            active ? "text-pink-600" : "text-white/90"
                          }`}
                        />
                        <span>{item.title}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Transactions Menu */}
        {filteredTransactionItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-white/60 font-semibold text-[11px] uppercase tracking-wider mb-1.5 px-3">
              Transactions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {filteredTransactionItems.map((item) => {
                  const active = isItemActive(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className={`group transition-all duration-300 rounded-2xl px-3 py-2.5 relative overflow-hidden font-medium text-sm ${
                          active
                            ? "bg-white text-pink-600 shadow-md shadow-pink-900/10 font-bold"
                            : "text-white/80 hover:bg-white/15 hover:text-white"
                        }`}
                      >
                        <Link
                        href={item.url}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                          <item.icon
                            className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                              active ? "text-pink-600" : "text-white/90"
                            }`}
                          />
                          <span>{item.title}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Reports Menu */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-white/60 font-semibold text-[11px] uppercase tracking-wider mb-1.5 px-3">
            Reports
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {reportItems.map((item) => {
                const active = isItemActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={`group transition-all duration-300 rounded-2xl px-3 py-2.5 relative overflow-hidden font-medium text-sm ${
                        active
                          ? "bg-white text-pink-600 shadow-md shadow-pink-900/10 font-bold"
                          : "text-white/80 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      <Link
                        href={item.url}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <item.icon
                          className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                            active ? "text-pink-600" : "text-white/90"
                          }`}
                        />
                        <span>{item.title}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile & Logout */}
      <SidebarFooter className="bg-transparent border-t border-white/10 p-3 mt-auto">
        <SidebarMenu className="space-y-2">
          <SidebarMenuItem>
            <div className="flex items-center space-x-3 bg-white/15 rounded-2xl p-2.5 backdrop-blur-md border border-white/15">
              <div className="w-9 h-9 bg-gradient-to-br from-white/40 to-white/10 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs truncate text-white">{user?.name}</div>
                <div className="text-white/70 text-[10px] capitalize font-medium">{user?.role}</div>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="group text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 rounded-xl w-full px-3 py-2 border border-white/10 hover:border-white/30 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
