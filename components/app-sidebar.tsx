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

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.url === "/users") return hasPermission("admin")
    return true
  })

  const filteredTransactionItems = transactionItems.filter((item) => {
    if (!hasPermission("staff")) return false // Viewers can't access transactions
    return true
  })

  return (
    <Sidebar className="gradient-sidebar border-r-0">
      <SidebarContent className="bg-transparent">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-2 px-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="group text-white/80 hover:bg-white/15 hover:text-white transition-all duration-300 rounded-xl data-[active=true]:bg-white/25 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-white/10 px-3 py-2.5 relative overflow-hidden"
                  >
                    <Link href={item.url}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Transactions Menu */}
        {filteredTransactionItems.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-2 px-2">
              Transactions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredTransactionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="group text-white/80 hover:bg-white/15 hover:text-white transition-all duration-300 rounded-xl data-[active=true]:bg-white/25 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-white/10 px-3 py-2.5 relative overflow-hidden"
                    >
                      <Link href={item.url}>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Reports Menu */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-white/70 font-semibold text-xs uppercase tracking-wider mb-2 px-2">
            Reports
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {reportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="group text-white/80 hover:bg-white/15 hover:text-white transition-all duration-300 rounded-xl data-[active=true]:bg-white/25 data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-white/10 px-3 py-2.5 relative overflow-hidden"
                  >
                    <Link href={item.url}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <item.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile & Logout */}
      <SidebarFooter className="bg-transparent border-t border-white/10 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-4 text-white/90">
              <div className="flex items-center space-x-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate text-white">{user?.name}</div>
                  <div className="text-white/60 text-xs capitalize font-medium">{user?.role}</div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="group text-white/80 hover:bg-red-500/20 hover:text-white transition-all duration-300 rounded-xl w-full mx-2 px-3 py-2.5 border border-white/10 hover:border-red-400/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 relative z-10" />
              <span className="font-medium relative z-10">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}