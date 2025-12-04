"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTableV2 as DataTable } from "@/components/data-table";
import { ImportModal } from "./import/import-modal"

interface Customer {
  id: number
  name: string
  phone: string | null
  address: string | null
  email: string | null
  status: string
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "name",
    header: "Customer Name",
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
]

export default function CustomersPage() {
  const router = useRouter()

  const [data, setData] = React.useState<Customer[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [sortField, setSortField] = React.useState("createdAt")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc")
  const [loading, setLoading] = React.useState(false)
  const [openImport, setOpenImport] = React.useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/customers?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(
          search
        )}&sortField=${sortField}&sortOrder=${sortOrder}`
      )
      const json = await res.json()
      setData(json.data)
      setTotalCount(json.totalCount)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [pageIndex, pageSize, search, sortField, sortOrder])

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Customers
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenImport(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import XLSX
          </Button>
          <Button asChild className="btn-gradient border-0">
            <Link href="/customers/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Link>
          </Button>
        </div>
      </div>

      <div className="enhanced-card p-6">
        <DataTable
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          searchPlaceholder="Search customers..."
          onSearchChange={(value) => {
            setPageIndex(0)
            setSearch(value)
          }}
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex)
            setPageSize(newPageSize)
          }}
          onSortingChange={(sorting) => {
            if (sorting.length > 0) {
              setSortField(sorting[0].id);
              setSortOrder(sorting[0].desc ? "desc" : "asc");
            }
          }}
          onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
        />
      </div>

      <ImportModal open={openImport} onClose={() => setOpenImport(false)} onImported={fetchData} />
    </div>
  )
}
