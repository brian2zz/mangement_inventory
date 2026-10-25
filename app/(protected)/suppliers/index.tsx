"use client"

import * as React from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { ArrowUpDown, Plus, Upload, Building2, Phone, Mail, MapPin, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { ImportModal } from "./import/import-modal"
import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface Supplier {
  id: number
  name: string
  phone: string | null
  address: string | null
  email: string | null
  status?: string
}

export default function SuppliersPage() {
  const router = useRouter()

  const [data, setData] = React.useState<Supplier[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [loading, setLoading] = React.useState(false)
  const [openImport, setOpenImport] = React.useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const sortField = sorting[0]?.id ?? "createdAt"
      const sortOrder = sorting[0]?.desc ? "desc" : "asc"

      const res = await apiFetch(
        `/suppliers?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(
          search
        )}&sortField=${sortField}&sortOrder=${sortOrder}`,
        {
          method: "GET",
        }
      )
      const json = await res.json()
      setData(json.data)
      setTotalCount(json.totalCount)
    } catch (err) {
      console.error("Failed to load suppliers", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [pageIndex, pageSize, search, sorting])

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-pink-50/80 text-pink-700 border border-pink-200/60 shadow-xs">
          #{row.getValue("id")}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Supplier Name
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue("name") as string
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-600 shadow-xs border border-pink-200/40">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-800 hover:text-pink-600 transition-colors block">
                {name}
              </span>
              <span className="text-[11px] text-gray-400">Vendor Rekanan</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone Number",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string
        return phone ? (
          <div className="flex items-center gap-1.5 text-gray-700 font-medium text-xs">
            <Phone className="w-3.5 h-3.5 text-pink-400" />
            <span>{phone}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">-</span>
        )
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string
        return email ? (
          <div className="flex items-center gap-1.5 text-gray-700 text-xs">
            <Mail className="w-3.5 h-3.5 text-pink-400" />
            <span className="truncate max-w-[200px]">{email}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">-</span>
        )
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const address = row.getValue("address") as string
        return address ? (
          <div className="flex items-center gap-1.5 text-gray-600 text-xs max-w-[260px]">
            <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">-</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = (row.getValue("status") as string) || "active"
        return (
          <Badge
            className={
              status === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs"
                : "bg-gray-100 text-gray-700 border-gray-200 shadow-none font-semibold text-xs"
            }
          >
            {status}
          </Badge>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Suppliers Directory
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
              <Building2 className="w-3 h-3 text-pink-500" /> Vendor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola data mitra pemasok, kontak person perwakilan, dan koordinasi pengadaan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setOpenImport(true)}
            className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-xs font-semibold shadow-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5 text-pink-600" />
            Import XLSX
          </Button>
          <Button asChild className="btn-gradient border-0 rounded-full px-5 shadow-sm text-xs font-semibold">
            <Link href="/suppliers/add">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Daftar Pemasok Aktif</h2>
              <p className="text-xs text-gray-500">Klik pada baris untuk melihat rincian & memperbarui profil</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-100/70 text-pink-700">
            {totalCount} Total Vendors
          </span>
        </div>

        <div className="p-6">
          <DataTable
            columns={columns}
            data={data}
            totalCount={totalCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            loading={loading}
            searchPlaceholder="Cari nama supplier, telepon, atau email..."
            haveFilterExport={false}
            linkExport="/suppliers/export"
            onSearchChange={(val) => {
              setPageIndex(0)
              setSearch(val)
            }}
            onPaginationChange={(newPage, newSize) => {
              setPageIndex(newPage)
              setPageSize(newSize)
            }}
            onSortingChange={setSorting}
            onRowClick={(row) => router.push(`/suppliers?id=${row.id}`)}
          />
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal open={openImport} onClose={() => setOpenImport(false)} onImported={fetchData} />
    </div>
  )
}
