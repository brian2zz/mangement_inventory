"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  cardNumber: string
  productName: string
  category: string
  partNumber: string
  stock: number
}

const data: Product[] = [
  {
    id: "1",
    cardNumber: "C001",
    productName: "Widget A",
    category: "Electronics",
    partNumber: "PN001",
    stock: 75,
  },
  {
    id: "2",
    cardNumber: "C002",
    productName: "Widget B",
    category: "Mechanical",
    partNumber: "PN002",
    stock: 40,
  },
  {
    id: "3",
    cardNumber: "C003",
    productName: "Widget C",
    category: "Electronics",
    partNumber: "PN003",
    stock: 200,
  },
  {
    id: "4",
    cardNumber: "C004",
    productName: "Component X",
    category: "Hardware",
    partNumber: "PN004",
    stock: 15,
  },
  {
    id: "5",
    cardNumber: "C005",
    productName: "Assembly Y",
    category: "Mechanical",
    partNumber: "PN005",
    stock: 88,
  },
]

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "cardNumber",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Card Number
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
    accessorKey: "stock",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      return <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>{stock}</Badge>
    },
  },
]

export default function ProductsPage() {
  const router = useRouter()

  const handleRowClick = (product: Product) => {
    router.push(`/products/${product.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Products
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/products/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search products..." onRowClick={handleRowClick} />
      </div>
    </div>
  )
}
