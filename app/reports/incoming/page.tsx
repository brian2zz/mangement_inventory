"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface IncomingReport {
  date: string
  productName: string
  category: string
  partNumber: string
  supplier: string
  destination: string
  quantityIn: number
  currentStock: number
  remarks: string
}

const data: IncomingReport[] = [
  {
    date: "2024-01-15",
    productName: "Widget A",
    category: "Electronics",
    partNumber: "PN001",
    supplier: "Supplier ABC",
    destination: "Warehouse 1",
    quantityIn: 100,
    currentStock: 100,
    remarks: "Initial stock",
  },
  {
    date: "2024-01-16",
    productName: "Widget B",
    category: "Mechanical",
    partNumber: "PN002",
    supplier: "Supplier XYZ",
    destination: "Warehouse 2",
    quantityIn: 50,
    currentStock: 50,
    remarks: "New arrival",
  },
  {
    date: "2024-01-18",
    productName: "Widget C",
    category: "Electronics",
    partNumber: "PN003",
    supplier: "Supplier DEF",
    destination: "Warehouse 1",
    quantityIn: 200,
    currentStock: 200,
    remarks: "Bulk order",
  },
  {
    date: "2024-01-20",
    productName: "Component X",
    category: "Hardware",
    partNumber: "PN004",
    supplier: "Supplier ABC",
    destination: "Warehouse 3",
    quantityIn: 75,
    currentStock: 75,
    remarks: "Special order",
  },
]

const columns: ColumnDef<IncomingReport>[] = [
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
    accessorKey: "supplier",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Supplier
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
    accessorKey: "quantityIn",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Quantity In
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const quantity = row.getValue("quantityIn") as number
      return <Badge variant="default">{quantity}</Badge>
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

export default function IncomingProductReportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Incoming Product Report</h1>
      </div>

      <DataTable columns={columns} data={data} searchPlaceholder="Search incoming products..." />
    </div>
  )
}
