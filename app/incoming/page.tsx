"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface IncomingProduct {
  id: string
  date: string
  supplier: string
  notes: string
  submitStatus: "Draft" | "Done"
  totalItems: number
}

const data: IncomingProduct[] = [
  {
    id: "1",
    date: "2024-01-15",
    supplier: "Supplier ABC",
    notes: "Monthly stock replenishment",
    submitStatus: "Done",
    totalItems: 5,
  },
  {
    id: "2",
    date: "2024-01-16",
    supplier: "Supplier XYZ",
    notes: "Emergency stock order",
    submitStatus: "Draft",
    totalItems: 3,
  },
  {
    id: "3",
    date: "2024-01-18",
    supplier: "Supplier DEF",
    notes: "Bulk order for Q1",
    submitStatus: "Done",
    totalItems: 8,
  },
  {
    id: "4",
    date: "2024-01-19",
    supplier: "Supplier GHI",
    notes: "Special components",
    submitStatus: "Draft",
    totalItems: 2,
  },
]

const columns: ColumnDef<IncomingProduct>[] = [
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

export default function IncomingProductsPage() {
  const router = useRouter()

  const handleRowClick = (item: IncomingProduct) => {
    router.push(`/incoming/${item.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Incoming Products
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/incoming/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Incoming Product
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder="Search incoming products..."
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  )
}
