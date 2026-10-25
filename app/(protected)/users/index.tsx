"use client"

import * as React from "react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
import { ArrowUpDown, Plus, ShieldCheck, Mail, Phone, MapPin, Sparkles, User as UserIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { apiFetch } from "@/lib/api"

interface User {
  id: number | string
  name: string
  email: string
  phone: string | null
  address: string | null
  role: "admin" | "staff" | "viewer"
  status?: "active" | "inactive" | "suspended"
}

export default function UsersPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()

  const [data, setData] = React.useState<User[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [loading, setLoading] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const sortField = sorting[0]?.id ?? "createdAt"
      const sortOrder = sorting[0]?.desc ? "desc" : "asc"

      const res = await apiFetch(
        `/users?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(
          search
        )}&sortField=${sortField}&sortOrder=${sortOrder}`,
        { method: "GET" }
      )
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
        setTotalCount(json.total ?? json.totalCount ?? json.data.length)
      } else {
        setData(json.data || [])
        setTotalCount(json.total || 0)
      }
    } catch (err) {
      console.error("Gagal memuat daftar pengguna:", err)
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search, sorting])

  React.useEffect(() => {
    if (hasPermission("admin")) {
      fetchData()
    }
  }, [fetchData, hasPermission])

  // Check if user has admin permission
  if (!hasPermission("admin")) {
    return (
      <div className="space-y-6 min-h-screen flex items-center justify-center p-6">
        <div className="enhanced-card p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Akses Terbatas</h1>
          <p className="text-sm text-gray-500">
            Halaman Manajemen Pengguna hanya dapat diakses oleh akun dengan hak akses Administrator.
          </p>
          <Button onClick={() => router.push("/")} className="btn-gradient border-0 rounded-full px-5 mt-6 text-xs font-semibold">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const columns: ColumnDef<User>[] = [
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
          Nama Pengguna
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = (row.getValue("name") as string) || (row.original as any).userName || "-"
        const role = row.original.role
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-600 shadow-xs border border-pink-200/40">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-800 hover:text-pink-600 transition-colors block">
                {name}
              </span>
              <span className="text-[11px] text-gray-400 capitalize">{role} Account</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
        </Button>
      ),
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
      accessorKey: "phone",
      header: "Telepon",
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
      accessorKey: "address",
      header: "Alamat",
      cell: ({ row }) => {
        const address = row.getValue("address") as string
        return address ? (
          <div className="flex items-center gap-1.5 text-gray-600 text-xs max-w-[240px]">
            <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs italic">-</span>
        )
      },
    },
    {
      accessorKey: "role",
      header: "Hak Akses (Role)",
      cell: ({ row }) => {
        const role = (row.getValue("role") as string) || "staff"
        return (
          <Badge
            className={
              role === "admin"
                ? "bg-purple-50 text-purple-700 border-purple-200 shadow-none font-semibold text-xs capitalize"
                : role === "staff"
                ? "bg-pink-50 text-pink-700 border-pink-200 shadow-none font-semibold text-xs capitalize"
                : "bg-gray-100 text-gray-700 border-gray-200 shadow-none font-semibold text-xs capitalize"
            }
          >
            {role}
          </Badge>
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
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs uppercase"
                : "bg-rose-50 text-rose-700 border-rose-200 shadow-none font-semibold text-xs uppercase"
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
              User Management
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
              <ShieldCheck className="w-3 h-3 text-pink-500" /> Admin Area
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Kelola data staf operasional, administrator sistem, dan hak kontrol akses
          </p>
        </div>

        <Button asChild className="btn-gradient border-0 rounded-full px-5 shadow-sm text-xs font-semibold self-end sm:self-auto">
          <Link href="/users/add">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Tambah User Baru
          </Link>
        </Button>
      </div>

      {/* Table Card */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Daftar Akun Pengguna</h2>
              <p className="text-xs text-gray-500">Klik baris untuk mengubah peran atau mereset kredensial pengguna</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-100/70 text-pink-700">
            {totalCount} Total Pengguna
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
            searchPlaceholder="Cari nama pengguna, email, atau nomor telepon..."
            onSearchChange={(val) => {
              setPageIndex(0)
              setSearch(val)
            }}
            onPaginationChange={(newPage, newSize) => {
              setPageIndex(newPage)
              setPageSize(newSize)
            }}
            onSortingChange={setSorting}
            onRowClick={(user) => router.push(`/users?id=${user.id}`)}
          />
        </div>
      </div>
    </div>
  )
}
