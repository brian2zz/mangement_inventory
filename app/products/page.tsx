"use client"

import * as React from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { ArrowUpDown, Plus, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { ImportModal } from "./import/import-modal"

// ===================== INTERFACE =====================
interface Product {
  id: number
  cardNumber: string | null
  productName: string
  category: string
  partNumber: string | null
  stock: number
  status?: string
}

// ===================== COLUMNS =====================
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "cardNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Card Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Part Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      return (
        <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>
          {stock}
        </Badge>
      )
    },
  },
]

// ===================== MAIN COMPONENT =====================
export default function ProductsPage() {
  const router = useRouter()

  const [data, setData] = React.useState<Product[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [loading, setLoading] = React.useState(false)
  const [openImport, setOpenImport] = React.useState(false)

  // ===================== FETCH DATA =====================
  const fetchData = async () => {
    setLoading(true)
    try {
      const sortField = sorting[0]?.id ?? "createdAt"
      const sortOrder = sorting[0]?.desc ? "desc" : "asc"

      const res = await fetch(
        `/api/products?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(
          search
        )}&sortField=${sortField}&sortOrder=${sortOrder}`
      )

      if (!res.ok) throw new Error("Failed to fetch products")
      const json = await res.json()
      setData(json.data)
      setTotalCount(json.totalCount)
    } catch (err) {
      console.error("Failed to load products:", err)
      // fallback dummy data
      setData([
        {
          id: 1,
          cardNumber: "C001",
          productName: "Widget A",
          category: "Electronics",
          partNumber: "PN001",
          stock: 75,
          status: "active",
        },
        {
          id: 2,
          cardNumber: "C002",
          productName: "Widget B",
          category: "Mechanical",
          partNumber: "PN002",
          stock: 40,
          status: "active",
        },
      ])
      setTotalCount(2)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [pageIndex, pageSize, search, sorting])

  // ===================== HANDLE ROW CLICK =====================
  const handleRowClick = (product: Product) => {
    router.push(`/products/${product.id}`)
  }

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Products
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import XLSX
          </Button>
          <Button asChild className="btn-gradient border-0">
            <Link href="/products/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* ===== DATA TABLE ===== */}
      <div className="enhanced-card p-6">
        <DataTable
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          searchPlaceholder="Search products..."
          onSearchChange={(val) => {
            setPageIndex(0)
            setSearch(val)
          }}
          onPaginationChange={(newPage, newSize) => {
            setPageIndex(newPage)
            setPageSize(newSize)
          }}
          onSortingChange={setSorting}
          onRowClick={handleRowClick}
        />
      </div>

      {/* ===== IMPORT MODAL ===== */}
      <ImportModal open={openImport} onClose={() => setOpenImport(false)} onImported={fetchData} />
    </div>
  )
}
