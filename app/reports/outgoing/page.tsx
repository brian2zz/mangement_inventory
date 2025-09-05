"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface OutgoingReport {
  date: string
  productName: string
  category: string
  partNumber: string
  source: string
  destination: string
  quantityOut: number
  currentStock: number
  remarks: string
}

const data: OutgoingReport[] = [
  {
    date: "2024-01-17",
    productName: "Widget A",
    category: "Electronics",
    partNumber: "PN001",
    source: "Warehouse 1",
    destination: "Customer 123",
    quantityOut: 25,
    currentStock: 75,
    remarks: "Customer order",
  },
  {
    date: "2024-01-19",
    productName: "Widget B",
    category: "Mechanical",
    partNumber: "PN002",
    source: "Warehouse 2",
    destination: "Customer 456",
    quantityOut: 10,
    currentStock: 40,
    remarks: "Small order",
  },
  {
    date: "2024-01-20",
    productName: "Component X",
    category: "Hardware",
    partNumber: "PN004",
    source: "Warehouse 3",
    destination: "Customer 789",
    quantityOut: 15,
    currentStock: 60,
    remarks: "Rush order",
  },
]

const columns: ColumnDef<OutgoingReport>[] = [
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
    accessorKey: "productName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Part Number
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
    accessorKey: "destination",
    header: "Destination",
  },
  {
    accessorKey: "quantityOut",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Quantity Out
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const quantity = row.getValue("quantityOut") as number
      return <Badge variant="destructive">{quantity}</Badge>
    },
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Current Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const stock = row.getValue("currentStock") as number
      return <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>{stock}</Badge>
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
]

export default function OutgoingProductReportPage() {
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Outgoing Product Report
        </h1>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search outgoing products..." />
      </div>
    </div>
  )
}
