"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, ArrowUpDown, Save, Trash2, Sparkles, Package, Building, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal"
import { apiFetch } from "@/lib/api"
import { DateRange } from "react-day-picker"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

/* ================== TYPES ================== */
interface Category {
  id: number
  categoryName: string
}

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  cardNumber?: string
  productName: string
  categoryId: number | null
  partNumber?: string
  description?: string
  supplierId?: number | null
  supplierName?: string
  unitPrice: number
  reorderLevel: number
  currentStock: number
  status: "active" | "passive"
}

interface detailRow {
  id: string
  date: string
  partNumber: string
  productName: string
  source: string
  stockIn: number
  stockOut: number
  destination: string
  stock: number
  remarks: string
}

const productColumns: ColumnDef<detailRow>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium text-slate-700">{row.getValue("date")}</span>,
  },
  {
    accessorKey: "source",
    header: () => <span className="font-medium text-slate-600 text-xs uppercase">Source</span>,
    cell: ({ row }) => <span className="text-slate-600">{row.getValue("source") || "—"}</span>,
  },
  {
    accessorKey: "stockIn",
    header: () => <span className="font-medium text-slate-600 text-xs uppercase">Stock In</span>,
    cell: ({ row }) => {
      const val = row.getValue("stockIn") as number
      return val > 0 ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
          +{val}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">-</span>
      )
    },
  },
  {
    accessorKey: "stockOut",
    header: () => <span className="font-medium text-slate-600 text-xs uppercase">Stock Out</span>,
    cell: ({ row }) => {
      const val = row.getValue("stockOut") as number
      return val > 0 ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
          -{val}
        </span>
      ) : (
        <span className="text-slate-400 text-xs">-</span>
      )
    },
  },
  {
    accessorKey: "destination",
    header: () => <span className="font-medium text-slate-600 text-xs uppercase">Destination</span>,
    cell: ({ row }) => <span className="text-slate-600">{row.getValue("destination") || "—"}</span>,
  },
  {
    accessorKey: "stock",
    header: () => <span className="font-medium text-slate-600 text-xs uppercase">Stock</span>,
    cell: ({ row }) => (
      <span className="font-bold font-mono text-slate-700">
        {row.getValue("stock")}
      </span>
    ),
  },
  {
    accessorKey: "remarks",
    header: () => <span className="font-medium text-slate-600 text-xs uppercase">Remarks</span>,
    cell: ({ row }) => (
      <span className="text-xs text-slate-500 italic max-w-[200px] truncate block">
        {row.getValue("remarks") || "—"}
      </span>
    ),
  },
]

/* ================== MAIN PAGE ================== */
export default function ProductDetailPage({ id }: { id: string }) {
  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)
  const [product, setProduct] = React.useState<Product | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false)

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  })
  const [data, setData] = React.useState<detailRow[]>([])
  const [totalCount, setTotalCount] = React.useState(0)

  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([
    { id: "date", desc: true },
  ])

  const [search, setSearch] = React.useState("")

  /* ================== FETCH PRODUCT LEDGER ================== */
  const fetchData = React.useCallback(async () => {
    if (!dateRange?.from || !dateRange.to) return

    setIsLoading(true)

    const sort = sorting[0]
    const sortField = sort?.id ?? "date"
    const sortOrder = sort?.desc ? "desc" : "asc"
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    const params = new URLSearchParams()
    params.set("page", String(pageIndex + 1))
    params.set("limit", String(pageSize))
    params.set("search", search)
    params.set("sortField", sortField)
    params.set("sortOrder", sortOrder)
    params.set("from", dateRange.from.toISOString())
    params.set("to", dateRange.to.toISOString())
    params.set("productId", id)

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/rekap?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    )
    const json = await res.json()

    if (json.success) {
      setData(json.data)
      setTotalCount(json.totalCount)
    } else {
      console.error(json.error)
    }

    setIsLoading(false)
  }, [pageIndex, pageSize, sorting, dateRange, search, id])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ================== FETCH INITIAL PRODUCT & CATEGORIES ================== */
  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiFetch(`/products/${id}`)
        const json = await res.json()
        if (json.success) setProduct(json.data)
      } catch (err) {
        console.error(err)
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await apiFetch("/categories?limit=100")
        const json = await res.json()
        if (json.success) setCategories(json.data)
      } catch (err) {
        console.error(err)
      }
    }

    if (id) {
      fetchProduct()
      fetchCategories()
    }
  }, [id])

  /* ================== SAVE ================== */
  const handleSave = async () => {
    if (!product) return

    setIsLoading(true)
    try {
      const res = await apiFetch(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          cardNumber: product.cardNumber || null,
          productName: product.productName,
          partNumber: product.partNumber || null,
          description: product.description || null,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          unitPrice: product.unitPrice,
          reorderLevel: product.reorderLevel,
          status: product.status,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui produk")
      }

      alert("Produk berhasil diperbarui!")
      router.push("/products")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Gagal menyimpan perubahan")
    } finally {
      setIsLoading(false)
    }
  }

  /* ================== DELETE ================== */
  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch(`/products/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menghapus produk")
      }

      alert("Produk berhasil dihapus!")
      router.push("/products")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Gagal menghapus produk")
    } finally {
      setIsLoading(false)
    }
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Memuat detail produk...
      </div>
    )
  }

  return (
    <div className="space-y-7 min-h-screen p-2 sm:p-4 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full w-9 h-9 bg-white/90 hover:bg-pink-50 border border-pink-200/80 shadow-xs hover:border-pink-300 text-pink-600 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Edit Product
              </h1>
              <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola rincian produk, harga, supplier, dan pantau log mutasi stoknya.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-gradient border-0 px-5 py-2 text-xs sm:text-sm"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full px-4 py-2 text-xs sm:text-sm text-rose-600 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-pink-200 bg-white/95 backdrop-blur-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-800">Hapus Produk?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500">
                  Tindakan ini tidak dapat dibatalkan. Produk akan dihapus permanen dari katalog sistem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="rounded-full bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Ya, Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* PRODUCT INFORMATION CARD */}
      <Card className="enhanced-card border border-pink-100/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 via-rose-50/30 to-transparent border-b border-pink-100/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
                  Detail Informasi Produk
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Ubah data spesifikasi barang, harga satuan, dan status ketersediaan.
                </CardDescription>
              </div>
            </div>

            {/* STATUS TOGGLE PILL */}
            <div className="flex items-center gap-2.5 bg-white/80 border border-pink-200/60 px-3.5 py-1.5 rounded-full shadow-xs">
              <Switch
                checked={product.status === "active"}
                onCheckedChange={(checked) =>
                  setProduct({
                    ...product,
                    status: checked ? "active" : "passive",
                  })
                }
              />
              <span
                className={`text-xs font-bold ${
                  product.status === "active" ? "text-pink-600" : "text-slate-400"
                }`}
              >
                {product.status === "active" ? "Active" : "Passive"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* KOLOM KIRI */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Product Name
                </Label>
                <Input
                  value={product.productName}
                  onChange={(e) => setProduct({ ...product, productName: e.target.value })}
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 font-medium"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Category
                </Label>
                <Select
                  value={product.categoryId ? String(product.categoryId) : ""}
                  onValueChange={(v) => setProduct({ ...product, categoryId: Number(v) })}
                >
                  <SelectTrigger className="rounded-xl bg-white/90 border-slate-200 focus:ring-pink-200">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-pink-200 bg-white/95 backdrop-blur-md">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="hover:bg-pink-50">
                        {c.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Card Number
                </Label>
                <Input
                  value={product.cardNumber || ""}
                  onChange={(e) => setProduct({ ...product, cardNumber: e.target.value })}
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Part Number
                </Label>
                <Input
                  value={product.partNumber || ""}
                  onChange={(e) => setProduct({ ...product, partNumber: e.target.value })}
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                />
              </div>
            </div>

            {/* KOLOM KANAN */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Supplier
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={product.supplierName || ""}
                    readOnly
                    placeholder="Pilih supplier pemasok"
                    className="rounded-xl bg-slate-50/80 border-slate-200 text-slate-700"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenSupplierModal(true)}
                    className="rounded-xl bg-white/90 hover:bg-pink-50/70 border border-pink-200/80 text-pink-600 font-medium px-4"
                  >
                    <Building className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                    Pilih
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Unit Price (Rp)
                </Label>
                <Input
                  type="number"
                  value={product.unitPrice}
                  onChange={(e) => setProduct({ ...product, unitPrice: Number(e.target.value) })}
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Reorder Level
                  </Label>
                  <Input
                    type="number"
                    value={product.reorderLevel}
                    onChange={(e) => setProduct({ ...product, reorderLevel: Number(e.target.value) })}
                    className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Current Stock
                  </Label>
                  <Input
                    value={product.currentStock}
                    readOnly
                    className="rounded-xl bg-slate-100 border-slate-200 font-mono font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Deskripsi Produk
                </Label>
                <Textarea
                  rows={2}
                  value={product.description || ""}
                  onChange={(e) => setProduct({ ...product, description: e.target.value })}
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY PRODUCT & STOCK MOVEMENT LEDGER */}
      <div className="enhanced-card p-6 shadow-sm border border-pink-100/80">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                Riwayat Mutasi Stok Produk
              </h2>
              <p className="text-xs text-slate-400">
                Log pergerakan keluar-masuk stok untuk produk ini.
              </p>
            </div>
          </div>
        </div>

        <DataTable
          columns={productColumns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={isLoading}
          searchPlaceholder="Cari transaksi produk..."
          haveFilter={false}
          haveFilterExport={false}
          linkExport="/dashboard/rekap/export"
          filterExport={{ productId: id }}
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex)
            setPageSize(newPageSize)
          }}
          onSortingChange={(newSorting) => {
            setSorting(newSorting)
          }}
          onSearchChange={(value) => {
            setPageIndex(0)
            setSearch(value)
          }}
        />
      </div>

      {/* SUPPLIER MODAL */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={(s: Supplier) =>
          setProduct((p) => (p ? { ...p, supplierId: s.id, supplierName: s.name } : p))
        }
      />
    </div>
  )
}
