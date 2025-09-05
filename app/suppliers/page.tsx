"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"

interface Supplier {
  id: string
  supplierName: string
  phoneNumber: string
  address: string
  email: string
}

const data: Supplier[] = [
  {
    id: "1",
    supplierName: "Supplier ABC",
    phoneNumber: "+1 (555) 123-4567",
    address: "123 Industrial Ave, City, State 12345",
    email: "contact@supplierabc.com",
  },
  {
    id: "2",
    supplierName: "Supplier XYZ",
    phoneNumber: "+1 (555) 987-6543",
    address: "456 Manufacturing St, City, State 67890",
    email: "info@supplierxyz.com",
  },
  {
    id: "3",
    supplierName: "Supplier DEF",
    phoneNumber: "+1 (555) 456-7890",
    address: "789 Commerce Blvd, City, State 54321",
    email: "sales@supplierdef.com",
  },
]

const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "supplierName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Supplier Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone Number",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
]

export default function SuppliersPage() {
  const router = useRouter()

  const handleRowClick = (supplier: Supplier) => {
    router.push(`/suppliers/${supplier.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Suppliers
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/suppliers/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search suppliers..." onRowClick={handleRowClick} />
      </div>
    </div>
  )
}
