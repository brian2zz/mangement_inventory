"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"

interface User {
  id: string
  userName: string
  email: string
  phone: string
  address: string
  role: "admin" | "staff" | "viewer"
}

const data: User[] = [
  {
    id: "1",
    userName: "Admin User",
    email: "admin@inventory.com",
    phone: "+1 (555) 123-4567",
    address: "123 Admin St, City, State 12345",
    role: "admin",
  },
  {
    id: "2",
    userName: "Staff Member",
    email: "staff@inventory.com",
    phone: "+1 (555) 234-5678",
    address: "456 Staff Ave, City, State 67890",
    role: "staff",
  },
  {
    id: "3",
    userName: "Viewer User",
    email: "viewer@inventory.com",
    phone: "+1 (555) 345-6789",
    address: "789 Viewer Blvd, City, State 54321",
    role: "viewer",
  },
]

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "userName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          User Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge
          variant={role === "admin" ? "default" : role === "staff" ? "secondary" : "outline"}
          className="capitalize"
        >
          {role}
        </Badge>
      )
    },
  },
]

export default function UsersPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()

  // Check if user has admin permission
  if (!hasPermission("admin")) {
    return (
      <div className="space-y-6 gradient-bg min-h-screen p-6">
        <div className="enhanced-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  const handleRowClick = (user: User) => {
    router.push(`/users/${user.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          User Management
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/users/add">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search users..." onRowClick={handleRowClick} />
      </div>
    </div>
  )
}
