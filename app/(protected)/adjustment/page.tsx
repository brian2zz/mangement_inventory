"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle, ArrowUpDown, SlidersHorizontal, Sparkles } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder"
import { format } from "date-fns"

/* ======================================================
   TYPES — SESUAI API
====================================================== */
interface InventoryAdjustment {
    id: number
    product: string
    movementType: "adjustment_increase" | "adjustment_decrease"
    quantity: number
    previousStock: number
    newStock: number
    notes: string
    createdBy: string
    createdAt: string
}

export default function InventoryAdjustmentPage() {
    const router = useRouter()

    // =========================
    // STATE
    // =========================
    const [data, setData] = useState<InventoryAdjustment[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const [pageIndex, setPageIndex] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [search, setSearch] = useState("")
    const [sorting, setSorting] = useState<SortingState>([])
    const [filters, setFilters] = useState<any[]>([])

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    // =========================
    // FILTER FIELDS (MATCH API)
    // =========================
    const fields: FieldOption[] = [
        { name: "createdAt", label: "Tanggal", type: "date" },
        { name: "product", label: "Produk", type: "string" },
        { name: "movementType", label: "Tipe Adjustment", type: "string" },
        { name: "createdBy", label: "Dibuat Oleh", type: "string" },
    ]

    // =========================
    // FETCH DATA
    // =========================
    const fetchData = async () => {
        setLoading(true)
        setErrorMessage(null)

        try {
            const params = new URLSearchParams({
                page: (pageIndex + 1).toString(),
                limit: pageSize.toString(),
                search,
                sortField: sorting[0]?.id ?? "createdAt",
                sortOrder: sorting[0]?.desc ? "desc" : "asc",
            })

            if (filters.length > 0) {
                params.append("filters", JSON.stringify(filters))
            }

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/inventory-adjustments?${params}`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!res.ok) {
                const txt = await res.text()
                throw new Error(`Server error (${res.status}): ${txt}`)
            }

            const json = await res.json()

            if (!json.success || !Array.isArray(json.data)) {
                throw new Error("Invalid data from server")
            }

            setData(json.data)
            setTotal(json.totalCount ?? 0)
        } catch (err: any) {
            console.error("❌ Inventory Adjustment error:", err)
            setErrorMessage(err.message || "Gagal memuat inventory adjustment.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [pageIndex, pageSize, search, sorting, filters])

    // =========================
    // COLUMNS (MODERN SOFT LUXURY)
    // =========================
    const columns = useMemo<ColumnDef<InventoryAdjustment>[]>(() => [
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Date <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                </Button>
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"))
                return (
                    <span className="font-medium text-slate-700 text-xs">
                        {isNaN(date.getTime()) ? "-" : format(date, "dd MMM yyyy, HH:mm")}
                    </span>
                )
            },
        },

        {
            accessorKey: "product",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">Product</span>,
            cell: ({ row }) => (
                <span className="font-semibold text-slate-800 text-sm">
                    {row.getValue("product")}
                </span>
            ),
        },

        {
            accessorKey: "movementType",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">Type</span>,
            cell: ({ row }) => {
                const type = row.getValue("movementType") as string
                const isIncrease = type === "adjustment_increase"

                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isIncrease
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border border-rose-200/80"
                        }`}
                    >
                        {isIncrease ? "Increase" : "Decrease"}
                    </span>
                )
            },
        },

        {
            accessorKey: "quantity",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">Qty</span>,
            cell: ({ row }) => {
                const isOut = row.original.movementType === "adjustment_decrease"
                const rawQty = Number(row.getValue("quantity")) || 0
                const absQty = Math.abs(rawQty)
                return (
                    <span className={`font-mono text-xs font-bold ${isOut ? "text-rose-600" : "text-emerald-600"}`}>
                        {isOut ? `-${absQty}` : `+${absQty}`}
                    </span>
                )
            },
        },

        {
            accessorKey: "previousStock",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">Prev Stock</span>,
            cell: ({ row }) => (
                <span className="text-slate-500 font-mono text-xs">
                    {row.getValue("previousStock")}
                </span>
            ),
        },

        {
            accessorKey: "newStock",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">New Stock</span>,
            cell: ({ row }) => (
                <span className="font-bold text-slate-700 font-mono text-xs">
                    {row.getValue("newStock")}
                </span>
            ),
        },

        {
            accessorKey: "createdBy",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">Created By</span>,
            cell: ({ row }) => (
                <span className="text-slate-600 text-xs">
                    {row.getValue("createdBy")}
                </span>
            ),
        },

        {
            accessorKey: "notes",
            header: () => <span className="font-medium text-slate-600 text-xs uppercase">Reason</span>,
            cell: ({ row }) => (
                <span className="text-xs text-slate-500 italic max-w-[200px] truncate block">
                    {row.getValue("notes") || "—"}
                </span>
            ),
        },
    ], [])

    // =========================
    // RENDER
    // =========================
    return (
        <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                            Inventory Adjustment
                        </h1>
                        <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
                            <SlidersHorizontal className="w-4 h-4" />
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Riwayat dan pencatatan penyesuaian stok opname fisik gudang.
                    </p>
                </div>

                <Button asChild className="btn-gradient border-0 px-4 py-2 text-xs sm:text-sm">
                    <Link href="/adjustment/add" className="flex items-center">
                        <Plus className="mr-1.5 h-4 w-4" />
                        New Adjustment
                    </Link>
                </Button>
            </div>

            {/* ERROR */}
            {errorMessage && (
                <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 shadow-xs">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="flex-1 text-sm font-medium">{errorMessage}</p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-rose-300 text-rose-600 hover:bg-rose-100"
                        onClick={fetchData}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* TABLE */}
            <div className="enhanced-card p-6 shadow-sm border border-pink-100/80">
                <DataTable
                    columns={columns}
                    data={data}
                    totalCount={total}
                    loading={loading}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    searchPlaceholder="Cari riwayat adjustment..."
                    haveFilter
                    filterComponent={
                        <FilterBuilder
                            fields={fields}
                            value={filters}
                            onApply={(newFilters) => {
                                setFilters(newFilters)
                                setPageIndex(0)
                            }}
                        />
                    }
                    onPaginationChange={(p, s) => {
                        setPageIndex(p)
                        setPageSize(s)
                    }}
                    onSortingChange={setSorting}
                    onSearchChange={(val) => {
                        setSearch(val)
                        setPageIndex(0)
                    }}
                />
            </div>
        </div>
    )
}
