// app/products/import/import-modal.tsx
"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import * as XLSX from "xlsx"
import { useReactTable, getCoreRowModel, ColumnDef, flexRender } from "@tanstack/react-table"

interface ProductRow {
    cardNumber: string
    productName: string
    category: string // original category name from excel
    categoryId?: number | null // mapped id (if found/created)
    partNumber: string
    stock: number
    unitPrice: number
    reorderLevel: number
    supplier: string
    status: string
}

interface Category {
    id: number
    name: string
}

interface ImportModalProps {
    open: boolean
    onClose: () => void
    onImported: () => void
}

export function ImportModal({ open, onClose, onImported }: ImportModalProps) {
    const [products, setProducts] = React.useState<ProductRow[]>([])
    const [page, setPage] = React.useState(1)
    const pageSize = 10

    const [categories, setCategories] = React.useState<Category[]>([])
    const [loadingCategories, setLoadingCategories] = React.useState(false)
    const [autoCreateMissingCategories, setAutoCreateMissingCategories] = React.useState(true)

    // Fetch categories when modal opens
    React.useEffect(() => {
        if (!open) return
        let mounted = true
        const fetchCategories = async () => {
            setLoadingCategories(true)
            try {
                const res = await fetch("/api/categories")
                if (!res.ok) throw new Error("Failed to load categories")
                const json = await res.json()
                // Expecting { success: true, data: [{ id, name }, ...] } or { data: [...] }
                const list = json.data ?? json
                if (mounted) setCategories(list)
            } catch (err) {
                console.error("Failed to fetch categories:", err)
                setCategories([])
            } finally {
                if (mounted) setLoadingCategories(false)
            }
        }
        fetchCategories()
        return () => {
            mounted = false
        }
    }, [open])

    const columns = React.useMemo<ColumnDef<ProductRow>[]>(() => [
        { accessorKey: "cardNumber", header: "Card Number" },
        { accessorKey: "productName", header: "Product Name" },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => {
                const originalName = row.getValue("category") as string
                const id = (row.original as ProductRow).categoryId
                return (
                    <div className="flex items-center gap-2">
                        <span>{originalName || "-"}</span>
                        {id == null ? (
                            <span className="text-xs px-1 py-0.5 rounded bg-yellow-100 text-yellow-800">unknown</span>
                        ) : (
                            <span className="text-xs px-1 py-0.5 rounded bg-green-50 text-green-700">mapped</span>
                        )}
                    </div>
                )
            },
        },
        { accessorKey: "partNumber", header: "Part Number" },
        { accessorKey: "stock", header: "Stock" },
        { accessorKey: "unitPrice", header: "Unit Price" },
        { accessorKey: "reorderLevel", header: "Reorder Level" },
        { accessorKey: "supplier", header: "Supplier" },
        { accessorKey: "status", header: "Status" },
    ], [])

    const paginatedData = React.useMemo(
        () => products.slice((page - 1) * pageSize, page * pageSize),
        [products, page]
    )

    const table = useReactTable({ data: paginatedData, columns, getCoreRowModel: getCoreRowModel() })

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "Card Number": "C001",
                "Product Name": "Widget A",
                "Category": "Electronics",
                "Part Number": "PN001",
                "Stock": 100,
                "Unit Price": 25.99,
                "Reorder Level": 10,
                "Supplier": "Supplier ABC",
                "Status": "active",
            },
        ]
        const worksheet = XLSX.utils.json_to_sheet(templateData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products")
        XLSX.writeFile(workbook, "product-template.xlsx")
    }

    const mapCategoryNameToId = (name?: string | null): number | null => {
        if (!name || typeof name !== "string" || !name.trim()) return null
        const normalized = name.trim().toLowerCase()
        const found = categories.find(
            (c) => c && typeof c.name === "string" && c.name.trim().toLowerCase() === normalized
        )
        return found ? found.id : null
    }

    // 📦 Handle Upload Excel
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Pastikan categories sudah dimuat dulu
        let categoryList = categories
        if (categoryList.length === 0) {
            try {
                const res = await fetch("/api/categories")
                const json = await res.json()
                categoryList = json.data ?? json
                setCategories(categoryList)
            } catch (err) {
                console.error("⚠️ Gagal memuat kategori sebelum membaca Excel:", err)
                categoryList = []
            }
        }

        const safeMapCategoryNameToId = (name?: string | null): number | null => {
            if (!name || typeof name !== "string" || !name.trim()) return null
            const normalized = name.trim().toLowerCase()

            const found = categoryList.find((c: any) => {
                const catName =
                    typeof c.name === "string"
                        ? c.name.trim().toLowerCase()
                        : typeof c.categoryName === "string"
                            ? c.categoryName.trim().toLowerCase()
                            : null
                return catName === normalized
            })

            return found ? found.id : null
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const buffer = event.target?.result
                if (!buffer) throw new Error("Empty file buffer")

                const data = new Uint8Array(buffer as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                if (!firstSheet) throw new Error("Tidak ada sheet ditemukan")

                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" })
                if (!jsonData.length) throw new Error("Sheet kosong")

                const mapped = jsonData.map((r: any) => {
                    const categoryName =
                        typeof r["Category"] === "string" ? r["Category"].trim() : ""
                    const categoryId = safeMapCategoryNameToId(categoryName)

                    return {
                        cardNumber: String(r["Card Number"] || ""),
                        productName: String(r["Product Name"] || ""),
                        category: categoryName,
                        categoryId,
                        partNumber: String(r["Part Number"] || ""),
                        stock: Number(r["Stock"]) || 0,
                        unitPrice: Number(r["Unit Price"]) || 0,
                        reorderLevel: Number(r["Reorder Level"]) || 0,
                        supplier: String(r["Supplier"] || ""),
                        status: String(r["Status"] || "active"),
                    }
                })

                console.table(mapped) // 🔍 Debug lihat hasil mapping di console
                setProducts(mapped)
                setPage(1)
            } catch (err) {
                console.error("❌ Gagal membaca Excel:", err)
                alert("Gagal membaca file Excel. Pastikan format dan kolom sesuai template.")
            }
        }

        reader.readAsArrayBuffer(file)
    }

    // If there are missing categories (categoryId === null) and autoCreate is enabled,
    // create them via API and update the products with the created ids.
    const ensureMissingCategoriesCreated = async (rows: ProductRow[]) => {
        // Collect unique missing names
        const missingNames = Array.from(
            new Set(rows.filter((r) => r.category && (r.categoryId == null)).map((r) => r.category.trim()))
        ).filter(Boolean)

        if (missingNames.length === 0) return rows

        // Try to create each missing category via POST /api/categories
        const createdMap: Record<string, number> = {}

        for (const name of missingNames) {
            try {
                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                })
                if (!res.ok) {
                    // Try to read response body for debug
                    console.warn("Failed to create category:", name, await res.text())
                    continue
                }
                const json = await res.json()
                // Expect created: { success: true, category: { id, name } } or { id, name }
                const created = json.category ?? json
                if (created && created.id) {
                    createdMap[name.trim().toLowerCase()] = created.id
                    // also push to local categories state
                    setCategories((prev) => [...prev, { id: created.id, name: created.name }])
                }
            } catch (err) {
                console.error("Error creating category:", name, err)
            }
        }

        // Map back ids
        const updated = rows.map((r) => {
            if (r.category && (r.categoryId == null)) {
                const key = r.category.trim().toLowerCase()
                if (createdMap[key]) return { ...r, categoryId: createdMap[key] }
            }
            return r
        })

        return updated
    }

    const handleSave = async () => {
        if (products.length === 0) {
            alert("No products to import. Please upload an Excel file first.")
            return
        }

        // 1) Refresh categories to get most recent list before mapping/creating
        try {
            setLoadingCategories(true)
            const res = await fetch("/api/categories")
            const json = await res.json()
            const list = json.data ?? json
            setCategories(list)
        } catch (err) {
            console.warn("Failed to refresh categories before saving:", err)
        } finally {
            setLoadingCategories(false)
        }

        // 2) If some products still don't have categoryId, either create missing categories (if enabled)
        let prepared = products
        const hasMissingCategory = prepared.some((p) => p.category && (p.categoryId == null))
        if (hasMissingCategory && autoCreateMissingCategories) {
            prepared = await ensureMissingCategoriesCreated(prepared)
        }

        // 3) Build payload for backend: map fields to the API shape expected by /api/products
        const payload = prepared.map((p) => ({
            cardNumber: p.cardNumber || null,
            productName: p.productName || p.productName === "" ? p.productName : "Unnamed Product",
            categoryId: p.categoryId ?? null,
            partNumber: p.partNumber || null,
            description: null,
            stock: Number(p.stock) || 0,
            unitPrice: Number(p.unitPrice) || 0,
            reorderLevel: Number(p.reorderLevel) || 0,
            supplierId: null, // supplier name mapping not implemented here (could be added)
            status: p.status || "active",
        }))

        // Inform user about any rows that still have unknown categoryId
        const stillMissing = payload.filter((x) => x.categoryId == null && (x.categoryId !== 0))
        if (stillMissing.length > 0) {
            const proceed = confirm(
                `Terdapat ${stillMissing.length} produk yang kategori-nya belum terpetakan. Mereka akan diimport tanpa category. Lanjutkan?`
            )
            if (!proceed) return
        }

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const text = await res.text()
                console.error("Import failed:", text)
                alert("Failed to import products. Check console for details.")
                return
            }
            const json = await res.json()
            alert("Products imported successfully!")
            onImported()
            onClose()
        } catch (err) {
            console.error("Failed to save imported products:", err)
            alert("An error occurred while saving products.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                className="
    max-w-6xl w-full 
    bg-white 
    border border-pink-200 
    shadow-2xl 
    rounded-2xl 
    overflow-hidden 
    max-h-[85vh] 
    flex flex-col
  "
            >
                <DialogHeader className="flex-shrink-0 bg-pink-50/70 border-b border-pink-100 px-6 py-3">
                    <DialogTitle className="text-2xl font-semibold text-gray-800">Import Products</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* Upload + Template Buttons */}
                    <div className="flex justify-between items-center mb-4 gap-3">
                        <Input
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileUpload}
                            className="w-1/2 border border-pink-200 text-sm text-gray-700"
                        />
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                className="border-pink-200 text-pink-600"
                            >
                                Download Template
                            </Button>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={autoCreateMissingCategories}
                                    onChange={(e) => setAutoCreateMissingCategories(e.target.checked)}
                                />
                                <span>Auto-create missing categories</span>
                            </label>
                        </div>
                    </div>

                    {/* Table Section */}
                    {products.length > 0 ? (
                        <div className="space-y-5">
                            <div className="overflow-x-auto rounded-lg border border-pink-100 bg-white">
                                <table className="w-full border-collapse text-sm">
                                    <thead className="bg-pink-50 sticky top-0 z-10">
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <th
                                                        key={header.id}
                                                        className="border border-pink-100 px-3 py-2 text-left text-xs font-semibold text-pink-700"
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                    </th>
                                                ))}
                                            </tr>
                                        ))}
                                    </thead>
                                    <tbody>
                                        {table.getRowModel().rows.map((row, i) => (
                                            <tr
                                                key={row.id}
                                                className={`${i % 2 === 0 ? "bg-white" : "bg-pink-50/40"} hover:bg-pink-100/50 transition-colors`}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <td key={cell.id} className="border border-pink-100 px-3 py-2 text-gray-700 text-sm">
                                                        {flexRender(cell.column.columnDef.cell ?? cell.column.columnDef.accessorKey, cell.getContext())}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-between items-center text-sm">
                                <Button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="bg-pink-100 hover:bg-pink-200 text-pink-600"
                                >
                                    Prev
                                </Button>
                                <span className="text-gray-600">
                                    Page {page} / {Math.ceil(products.length / pageSize)}
                                </span>
                                <Button
                                    disabled={page * pageSize >= products.length}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="bg-pink-100 hover:bg-pink-200 text-pink-600"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-6 italic">Please upload an Excel (.xlsx) file first.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-pink-100 p-4 bg-pink-50/80 flex-shrink-0">
                    <Button
                        className="btn-gradient w-full py-2.5 text-white text-base font-medium shadow-sm"
                        onClick={handleSave}
                    >
                        Save to Database
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
