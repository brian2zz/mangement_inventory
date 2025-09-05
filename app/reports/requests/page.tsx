"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"

interface RequestReport {
  requestedItem: string
  requestedQuantity: number
  fulfilledQuantity: number
  requestDate: string
  fulfilledDate: string
  store: string
  unitPrice: number
  totalPrice: number
  remarks: string
  supplierLocation: string
}

const data: RequestReport[] = [
  {
    requestedItem: "Widget A",
    requestedQuantity: 50,
    fulfilledQuantity: 50,
    requestDate: "2024-01-10",
    fulfilledDate: "2024-01-15",
    store: "Store A",
    unitPrice: 25.99,
    totalPrice: 1299.5,
    remarks: "Completed on time",
    supplierLocation: "Warehouse 1",
  },
  {
    requestedItem: "Widget B",
    requestedQuantity: 30,
    fulfilledQuantity: 20,
    requestDate: "2024-01-12",
    fulfilledDate: "2024-01-16",
    store: "Store B",
    unitPrice: 15.5,
    totalPrice: 465.0,
    remarks: "Partial fulfillment",
    supplierLocation: "Warehouse 2",
  },
  {
    requestedItem: "Component X",
    requestedQuantity: 100,
    fulfilledQuantity: 0,
    requestDate: "2024-01-18",
    fulfilledDate: "",
    store: "Store C",
    unitPrice: 8.75,
    totalPrice: 875.0,
    remarks: "Pending supplier delivery",
    supplierLocation: "External Supplier",
  },
]

const columns: ColumnDef<RequestReport>[] = [
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
    accessorKey: "remarks",
    header: "Remarks",
  },
  {
    accessorKey: "supplierLocation",
    header: "Supplier Location",
  },
]

export default function RequestReportPage() {
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Request Report
        </h1>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search requests..." />
      </div>
    </div>
  )
}
