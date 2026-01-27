"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder"

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

    const token = localStorage.getItem("token")

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
    // COLUMNS
    // =========================
    const columns = useMemo<ColumnDef<InventoryAdjustment>[]>(() => [
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === "asc")
                    }
                >
                    Date <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) =>
                new Date(row.getValue("createdAt")).toLocaleString(),
        },

        {
            accessorKey: "product",
            header: "Product",
        },

        {
            accessorKey: "movementType",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("movementType") as string
                const isIncrease = type === "adjustment_increase"

                return (
                    <Badge variant={isIncrease ? "default" : "destructive"}>
                        {isIncrease ? "Increase" : "Decrease"}
                    </Badge>
                )
            },
        },

        {
            accessorKey: "quantity",
            header: "Qty",
            cell: ({ row }) => {
                const isOut =
                    row.original.movementType === "adjustment_decrease"

                return (
                    <Badge variant={isOut ? "destructive" : "default"}>
                        {isOut && "-"}
                        {row.getValue("quantity")}
                    </Badge>
                )
            },
        },

        {
            accessorKey: "previousStock",
            header: "Prev Stock",
        },

        {
            accessorKey: "newStock",
            header: "New Stock",
        },

        {
            accessorKey: "createdBy",
            header: "Created By",
        },

        {
            accessorKey: "notes",
            header: "Reason",
        },
    ], [])

    // =========================
    // RENDER
    // =========================
    return (
        <div className="space-y-6 gradient-bg min-h-screen p-6">
            {/* HEADER */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                    Inventory Adjustment
                </h1>

                <Button asChild className="btn-gradient border-0">
                    <Link href="/adjustment/add" className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        New Adjustment
                    </Link>
                </Button>
            </div>

            {/* ERROR */}
            {errorMessage && (
                <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <p className="flex-1 text-sm">{errorMessage}</p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600"
                        onClick={fetchData}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* TABLE */}
            <div className="enhanced-card p-6">
                <DataTable
                    columns={columns}
                    data={data}
                    totalCount={total}
                    loading={loading}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
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
