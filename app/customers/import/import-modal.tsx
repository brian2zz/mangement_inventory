"use client"

import * as React from "react"
import Papa from "papaparse"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"

interface Customer {
  customerName: string
  phoneNumber: string
  address: string
  status: string
}

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onImported: () => void
}

export function ImportModal({ open, onClose, onImported }: ImportModalProps) {
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [page, setPage] = React.useState(1)
  const pageSize = 10

  const columns = React.useMemo<ColumnDef<Customer>[]>(
    () => [
      { accessorKey: "customerName", header: "Customer Name" },
      { accessorKey: "phoneNumber", header: "Phone" },
      { accessorKey: "address", header: "Address" },
      { accessorKey: "status", header: "Status" },
    ],
    []
  )

  const paginatedData = React.useMemo(
    () => customers.slice((page - 1) * pageSize, page * pageSize),
    [customers, page, pageSize]
  )

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleDownloadTemplate = () => {
    // Data contoh
    const templateData = [
      {
        "Customer Name": "ABC Corporation",
        "Phone Number": "+1 (555) 111-2222",
        "Address": "100 Business Park, City, State 12345",
        "Status": "contact@abccorp.com",
      },
      {
        "Customer Name": "XYZ Industries",
        "Phone Number": "+1 (555) 333-4444",
        "Address": "200 Industrial Way, City, State 67890",
        "Status": "orders@xyzind.com",
      },
    ]

    // Buat worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers")

    // Simpan file xlsx
    XLSX.writeFile(workbook, "customer-template.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // Parse data ke JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Map header agar cocok dengan interface Customer
      const mapped = jsonData.map((row: any) => ({
        customerName: row["Customer Name"] || "",
        phoneNumber: row["Phone Number"] || "",
        address: row["Address"] || "",
        status: row["Status"] || "",
      }))

      setCustomers(mapped)
      setPage(1)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSave = async () => {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customers),
    })

    if (!res.ok) {
      alert("Failed to save data")
      return
    }
    alert("Customers imported successfully!")
    onImported()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle>Import Customers</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <Input type="file" accept=".xlsx" onChange={handleFileUpload} />
          <Button variant="outline" onClick={handleDownloadTemplate}>
            Download Template
          </Button>
        </div>

        {customers.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="border p-2 text-left">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="border p-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="p-4 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </Button>
              <span>
                Page {page} / {Math.ceil(customers.length / pageSize)}
              </span>
              <Button
                disabled={page * pageSize >= customers.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>

            <Button className="btn-gradient w-full" onClick={handleSave}>
              Save to Database
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
