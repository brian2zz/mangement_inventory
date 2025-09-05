"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"

interface OutgoingProduct {
  id: string
  date: string
  source: string
  notes: string
  submitStatus: "Draft" | "Done"
  totalItems: number
}

const data: OutgoingProduct[] = [
  {
    id: "1",
    date: "2024-01-15",
    source: "Warehouse 1",
    notes: "Customer order fulfillment",
    submitStatus: "Done",
    totalItems: 3,
  },
  {
    id: "2",
    date: "2024-01-16",
    source: "Warehouse 2",
    notes: "Emergency shipment",
    submitStatus: "Draft",
    totalItems: 2,
  },
  {
    id: "3",
    date: "2024-01-18",
    source: "Warehouse 1",
    notes: "Bulk customer order",
    submitStatus: "Done",
    totalItems: 5,
  },
]

const columns: ColumnDef<OutgoingProduct>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Source
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "totalItems",
    header: "Total Items",
  },
  {
    accessorKey: "notes",
    header: "Notes",
  },
  {
    accessorKey: "submitStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("submitStatus") as string
      return <Badge variant={status === "Done" ? "default" : "secondary"}>{status}</Badge>
    },
  },
]

export default function OutgoingProductsPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()

  // Check if user has permission (viewers can't access transactions)
  if (!hasPermission("staff")) {
    return (
      <div className="space-y-6 gradient-bg min-h-screen p-6">
        <div className="enhanced-card p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access transaction management.</p>
        </div>
      </div>
    )
  }

  const handleRowClick = (item: OutgoingProduct) => {
    router.push(`/outgoing/${item.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Outgoing Products
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/outgoing/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Outgoing Product
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="Search outgoing products..."
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}
