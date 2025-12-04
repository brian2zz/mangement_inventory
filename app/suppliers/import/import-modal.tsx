"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    type ColumnDef,
} from "@tanstack/react-table"

interface Supplier {
    supplierName: string
    phoneNumber: string
    address: string
    email: string
    status: string
}

interface ImportModalProps {
    open: boolean
    onClose: () => void
    onImported: () => void
}

export function ImportModal({ open, onClose, onImported }: ImportModalProps) {
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
    const [page, setPage] = React.useState(1)
    const pageSize = 10

    // 🔹 Definisi kolom tabel
    const columns = React.useMemo<ColumnDef<Supplier>[]>(
        () => [
            { accessorKey: "supplierName", header: "Supplier Name" },
            { accessorKey: "phoneNumber", header: "Phone Number" },
            { accessorKey: "address", header: "Address" },
            { accessorKey: "email", header: "Email" },
            { accessorKey: "status", header: "Status" },
        ],
        []
    )

    const paginatedData = React.useMemo(
        () => suppliers.slice((page - 1) * pageSize, page * pageSize),
        [suppliers, page]
    )

    const table = useReactTable({
        data: paginatedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    // 🔽 Download Template Excel
    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "Supplier Name": "Supplier ABC",
                "Phone Number": "+1 (555) 123-4567",
                "Address": "123 Industrial Ave, City, State 12345",
                "Email": "contact@supplierabc.com",
                "Status": "active",
            },
            {
                "Supplier Name": "Supplier XYZ",
                "Phone Number": "+1 (555) 987-6543",
                "Address": "456 Manufacturing St, City, State 67890",
                "Email": "info@supplierxyz.com",
                "Status": "inactive",
            },
        ]

        const worksheet = XLSX.utils.json_to_sheet(templateData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Suppliers")

        XLSX.writeFile(workbook, "supplier-template.xlsx")
    }

    // 📤 Upload & parse file Excel
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer)
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]

            const jsonData = XLSX.utils.sheet_to_json(worksheet)

            // Map ke interface Supplier
            const mapped = jsonData.map((row: any) => ({
                supplierName: row["Supplier Name"] || "",
                phoneNumber: row["Phone Number"] || "",
                address: row["Address"] || "",
                email: row["Email"] || "",
                status: row["Status"] || "active",
            }))

            setSuppliers(mapped)
            setPage(1)
        }
        reader.readAsArrayBuffer(file)
    }

    // 💾 Simpan ke database
    const handleSave = async () => {
        if (suppliers.length === 0) {
            alert("No data to import")
            return
        }

        const res = await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(suppliers),
        })

        if (!res.ok) {
            alert("❌ Failed to save suppliers")
            return
        }

        const result = await res.json()
        if (result.success) {
            alert(`✅ Imported ${result.count} suppliers successfully!`)
            onImported()
            onClose()
        } else {
            alert(`⚠️ Import failed: ${result.error}`)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full bg-white/95 backdrop-blur-sm border-pink-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-gray-800">
                        Import Suppliers
                    </DialogTitle>
                </DialogHeader>

                {/* 🔹 Upload & Template */}
                <div className="flex justify-between items-center mb-4">
                    <Input
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileUpload}
                        className="max-w-sm"
                    />
                    <Button
                        variant="outline"
                        onClick={handleDownloadTemplate}
                        className="border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                        Download Template
                    </Button>
                </div>

                {/* 🔹 Preview Table */}
                {suppliers.length > 0 && (
                    <div className="space-y-4">
                        <div className="overflow-x-auto rounded-md border border-pink-100">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-gradient-to-r from-pink-50 to-rose-50">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <tr key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <th
                                                    key={header.id}
                                                    className="border p-2 text-left text-gray-700 font-medium"
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    ))}
                                </thead>
                                <tbody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-pink-50">
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className="border p-2 text-gray-800">
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={columns.length}
                                                className="p-4 text-center text-gray-500"
                                            >
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Prev
                            </Button>
                            <span className="text-gray-700">
                                Page {page} / {Math.ceil(suppliers.length / pageSize)}
                            </span>
                            <Button
                                variant="outline"
                                disabled={page * pageSize >= suppliers.length}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>

                        <Button
                            className="btn-gradient w-full border-0"
                            onClick={handleSave}
                        >
                            Save to Database
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
