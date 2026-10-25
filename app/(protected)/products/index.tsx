"use client"

import * as React from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { ArrowUpDown, Plus, Upload, Sparkles, Package } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { ImportModal } from "./import/import-modal"
import { apiFetch } from "@/lib/api"
import { FieldOption, FilterBuilder } from "@/components/filters/FilterBuilder"

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

// ===================== COLUMNS (SOFT LUXURY PILLS) =====================
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "cardNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Card Number
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
        {row.getValue("cardNumber") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product Name
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-slate-800 hover:text-pink-600 transition-colors">
        {row.getValue("productName")}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200/60">
        {row.getValue("category") || "Uncategorized"}
      </span>
    ),
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Part Number
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-slate-600 font-mono text-xs">
        {row.getValue("partNumber") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      const isHigh = stock > 50
      const isMed = stock > 20
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isHigh
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
              : isMed
              ? "bg-amber-50 text-amber-700 border border-amber-200/80"
              : "bg-rose-50 text-rose-700 border border-rose-200/80 font-bold"
          }`}
        >
          {stock}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = (row.getValue("status") as string) || "active"
      const isActive = status.toLowerCase() === "active"

      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive
              ? "bg-pink-50 text-pink-700 border border-pink-200/80"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? "bg-pink-500" : "bg-slate-400"
            }`}
          />
          {isActive ? "Active" : "Inactive"}
        </span>
      )
    },
  },
]

export const productFilterFields: FieldOption[] = [
  {
    name: "name",
    label: "Nama Produk",
    type: "string",
    valueType: "text",
  },
  {
    name: "category_id",
    label: "Kategori",
    type: "relation",
    relationConfig: {
      fetchUrl: "/categories",
      labelKey: "categoryName",
      valueKey: "id",
    },
  },
  {
    name: "stock",
    label: "Stok",
    type: "number",
    valueType: "number",
  },
  {
    name: "unit_price",
    label: "Harga Satuan",
    type: "number",
    valueType: "number",
  },
  {
    name: "status",
    label: "Status",
    type: "string",
    valueType: "dropdown",
    options: [
      { label: "Aktif", value: "active" },
      { label: "Nonaktif", value: "inactive" },
    ],
  },
  {
    name: "created_at",
    label: "Tanggal Dibuat",
    type: "date",
    valueType: "date",
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
  const [filters, setFilters] = React.useState<any[]>([])

  // ===================== FETCH DATA =====================
  const fetchData = async () => {
    try {
      setLoading(true)

      const sort = sorting[0]

      // Backend ProductController mengharapkan `limit`, bukan `per_page`
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
        search,
      })

      if (sort) {
        params.append("sortField", sort.id)
        params.append("sortOrder", sort.desc ? "desc" : "asc")
      }

      if (filters.length > 0) {
        params.append("filters", JSON.stringify(filters))
      }

      const res = await apiFetch(`/products?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch products")

      const json = await res.json()
      setData(json.data)
      setTotalCount(json.totalCount)
    } catch (err) {
      console.error("Failed to load products:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [pageIndex, pageSize, search, sorting, filters])

  // ===================== HANDLE ROW CLICK =====================
  const handleRowClick = (product: Product) => {
    router.push(`/products?id=${product.id}`)
  }

  // ===================== RENDER =====================
  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-7xl mx-auto">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Products Catalogue
            </h1>
            <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola master data produk, nomor kartu, kode part, dan pemantauan stok barang.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setOpenImport(true)}
            className="rounded-full bg-white/90 hover:bg-pink-50/70 border border-pink-200/80 text-slate-700 shadow-xs hover:border-pink-300 px-4 py-2 text-xs sm:text-sm font-medium transition-all"
          >
            <Upload className="mr-1.5 h-4 w-4 text-pink-500" />
            Import XLSX
          </Button>

          <Button asChild className="btn-gradient border-0 px-4 py-2 text-xs sm:text-sm">
            <Link href="/products/add">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* ===== DATA TABLE ===== */}
      <div className="enhanced-card p-6 shadow-sm border border-pink-100/80">
        <DataTable
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilter
          filterComponent={
            <FilterBuilder
              fields={productFilterFields}
              value={filters}
              onApply={(val) => {
                setFilters(val)
                setPageIndex(0)
              }}
            />
          }
          haveFilterExport={false}
          linkExport="/products/export"
          searchPlaceholder="Cari produk berdasarkan nama, kode..."
          onSearchChange={(val) => {
            setPageIndex(0)
            setSearch(val)
          }}
          sorting={sorting}
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
