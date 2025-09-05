"use client"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"

interface Customer {
  id: string
  customerName: string
  phoneNumber: string
  address: string
  email: string
}

const data: Customer[] = [
  {
    id: "1",
    customerName: "ABC Corporation",
    phoneNumber: "+1 (555) 111-2222",
    address: "100 Business Park, City, State 12345",
    email: "contact@abccorp.com",
  },
  {
    id: "2",
    customerName: "XYZ Industries",
    phoneNumber: "+1 (555) 333-4444",
    address: "200 Industrial Way, City, State 67890",
    email: "orders@xyzind.com",
  },
  {
    id: "3",
    customerName: "Tech Solutions Ltd",
    phoneNumber: "+1 (555) 555-6666",
    address: "300 Tech Drive, City, State 54321",
    email: "info@techsolutions.com",
  },
]

const columns: ColumnDef<Customer>[] = [
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
    accessorKey: "customerName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Customer Name
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

export default function CustomersPage() {
  const router = useRouter()

  const handleRowClick = (customer: Customer) => {
    router.push(`/customers/${customer.id}`)
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Customers
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/customers/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search customers..." onRowClick={handleRowClick} />
      </div>
    </div>
  )
}
