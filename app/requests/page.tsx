"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface ProductRequest {
  id: string
  requestedItem: string
  requestedQuantity: number
  fulfilledQuantity: number
  requestDate: string
  fulfilledDate: string
  store: string
  unitPrice: number
  totalPrice: number
  status: "Pending" | "Partial" | "Fulfilled"
}

const data: ProductRequest[] = [
  {
    id: "1",
    requestedItem: "Widget A",
    requestedQuantity: 50,
    fulfilledQuantity: 50,
    requestDate: "2024-01-10",
    fulfilledDate: "2024-01-15",
    store: "Store A",
    unitPrice: 25.99,
    totalPrice: 1299.5,
    status: "Fulfilled",
  },
  {
    id: "2",
    requestedItem: "Widget B",
    requestedQuantity: 30,
    fulfilledQuantity: 20,
    requestDate: "2024-01-12",
    fulfilledDate: "2024-01-16",
    store: "Store B",
    unitPrice: 15.5,
    totalPrice: 465.0,
    status: "Partial",
  },
  {
    id: "3",
    requestedItem: "Component X",
    requestedQuantity: 100,
    fulfilledQuantity: 0,
    requestDate: "2024-01-18",
    fulfilledDate: "",
    store: "Store C",
    unitPrice: 8.75,
    totalPrice: 875.0,
    status: "Pending",
  },
]

const columns: ColumnDef<ProductRequest>[] = [
  {
    accessorKey: "requestedItem",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Requested Item
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "requestedQuantity",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Requested Qty
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "fulfilledQuantity",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fulfilled Qty
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "requestDate",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Request Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "fulfilledDate",
    header: "Fulfilled Date",
    cell: ({ row }) => {
      const date = row.getValue("fulfilledDate") as string
      return date || "N/A"
    },
  },
  {
    accessorKey: "store",
    header: "Store",
  },
  {
    accessorKey: "unitPrice",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Unit Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = row.getValue("unitPrice") as number
      return `$${price.toFixed(2)}`
    },
  },
  {
    accessorKey: "totalPrice",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const price = row.getValue("totalPrice") as number
      return `$${price.toFixed(2)}`
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "Fulfilled" ? "default" : status === "Partial" ? "secondary" : "destructive"}>
          {status}
        </Badge>
      )
    },
  },
]

export default function ProductRequestsPage() {
  const router = useRouter()

  const handleRowClick = (request: ProductRequest) => {
    router.push(`/requests/${request.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Product Requests
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/requests/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Request
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search requests..." onRowClick={handleRowClick} />
      </div>
    </div>
  )
}
