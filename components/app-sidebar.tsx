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
          <SidebarGroupLabel className="text-white/90 font-semibold text-sm tracking-wide">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg data-[active=true]:bg-white/20 data-[active=true]:text-white"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Transactions Menu */}
        {filteredTransactionItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/90 font-semibold text-sm tracking-wide">
              Transactions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredTransactionItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg data-[active=true]:bg-white/20 data-[active=true]:text-white"
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Reports Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/90 font-semibold text-sm tracking-wide">Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {reportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg data-[active=true]:bg-white/20 data-[active=true]:text-white"
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile & Logout */}
      <SidebarFooter className="bg-transparent border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-3 text-white/90">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{user?.name}</div>
                  <div className="text-white/70 text-xs capitalize">{user?.role}</div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="text-white/90 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-lg w-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
