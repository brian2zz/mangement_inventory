"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/* ================== Dummy Transaction Data ================== */
interface Transaction {
  date: string
  source: string
  stockIn: number
  stockOut: number
  destination: string
  remarks: string
  currentStock: number
}

const transactionData: Transaction[] = [
  {
    date: "2024-01-15",
    source: "Supplier ABC",
    stockIn: 100,
    stockOut: 0,
    destination: "Warehouse 1",
    remarks: "Initial stock",
    currentStock: 100,
  },
  {
    date: "2024-01-17",
    source: "Warehouse 1",
    stockIn: 0,
    stockOut: 25,
    destination: "Customer 123",
    remarks: "Customer order",
    currentStock: 75,
  },
]

const transactionColumns: ColumnDef<Transaction>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "source", header: "Source" },
  {
    accessorKey: "stockIn",
    header: "Stock In",
    cell: ({ row }) => <Badge variant="default">{row.getValue("stockIn")}</Badge>,
  },
  {
    accessorKey: "stockOut",
    header: "Stock Out",
    cell: ({ row }) => <Badge variant="destructive">{row.getValue("stockOut")}</Badge>,
  },
  { accessorKey: "destination", header: "Destination" },
  { accessorKey: "remarks", header: "Remarks" },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
    cell: ({ row }) => {
      const stock = row.getValue("currentStock") as number
      return <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>{stock}</Badge>
    },
  },
]

/* ================== MAIN PAGE ================== */
export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [isLoading, setIsLoading] = React.useState(false)
  const [product, setProduct] = React.useState<any | null>(null)
  const [categories, setCategories] = React.useState<any[]>([])

  /* ================== Fetch Product ================== */
  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`)
        const json = await res.json()
        if (json.success) setProduct(json.data)
        else console.error(json.error)
      } catch (err) {
        console.error("❌ Failed to fetch product:", err)
      }
    }

    fetchProduct()
  }, [id])

  /* ================== Fetch Categories ================== */
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const json = await res.json()

        if (json.success) {
          setCategories(json.data) // API returns { id, categoryName }
        }
      } catch (err) {
        console.error("❌ Failed to load categories:", err)
      }
    }

    fetchCategories()
  }, [])

  /* ================== Save Product ================== */
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      })

      const json = await res.json()
      if (json.success) alert("✅ Product updated successfully!")
      else alert("❌ " + json.error)
    } catch {
      alert("❌ Failed to update product")
    } finally {
      setIsLoading(false)
    }
  }

  /* ================== Delete Product ================== */
  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
      const json = await res.json()

      if (json.success) {
        alert("✅ Product deleted")
        router.push("/products")
      } else alert("❌ " + json.error)
    } catch {
      alert("❌ Failed to delete product")
    } finally {
      setIsLoading(false)
    }
  }

  if (!product)
    return (
      <div className="p-6 text-center text-gray-500 animate-pulse">
        Loading product details...
      </div>
    )

  /* ================== Render Page ================== */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>

          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Product Details
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save"}
          </Button>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200 max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ================== Product Info ================== */}
      <div className="enhanced-card p-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Card Number</Label>
            <Input
              value={product.cardNumber || ""}
              onChange={(e) => setProduct({ ...product, cardNumber: e.target.value })}
              className="gradient-input"
            />
          </div>

          <div className="grid gap-2">
            <Label>Product Name</Label>
            <Input
              value={product.productName || ""}
              onChange={(e) => setProduct({ ...product, productName: e.target.value })}
              className="gradient-input"
            />
          </div>

          {/* Category Dropdown from API */}
          <div className="grid gap-2">
            <Label>Category</Label>

            <Select
              value={product.categoryId ? String(product.categoryId) : ""}
              onValueChange={(value) =>
                setProduct({
                  ...product,
                  categoryId: Number(value),
                })
              }
            >
              <SelectTrigger className="gradient-input">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent className="bg-white/95 border-pink-200">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Part Number</Label>
            <Input
              value={product.partNumber || ""}
              onChange={(e) => setProduct({ ...product, partNumber: e.target.value })}
              className="gradient-input"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Supplier</Label>
            <Input
              value={product.supplier || ""}
              onChange={(e) => setProduct({ ...product, supplier: e.target.value })}
              className="gradient-input"
            />
          </div>

          <div className="grid gap-2">
            <Label>Unit Price</Label>
            <Input
              type="number"
              value={product.unitPrice || ""}
              onChange={(e) => setProduct({ ...product, unitPrice: e.target.value })}
              className="gradient-input"
            />
          </div>

          <div className="grid gap-2">
            <Label>Reorder Level</Label>
            <Input
              type="number"
              value={product.reorderLevel || ""}
              onChange={(e) => setProduct({ ...product, reorderLevel: e.target.value })}
              className="gradient-input"
            />
          </div>

          <div className="grid gap-2">
            <Label>Current Stock</Label>
            <Input
              type="number"
              value={product.currentStock || ""}
              onChange={(e) =>
                setProduct({ ...product, currentStock: Number(e.target.value) })
              }
              className="gradient-input"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="enhanced-card p-6">
        <Label>Description</Label>
        <Textarea
          value={product.description || ""}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
          rows={3}
          className="gradient-input resize-none"
        />
      </div>

      {/* ================== Transaction History ================== */}
      <div className="enhanced-card p-6">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Transaction History
        </h2>

        <DataTable
          columns={transactionColumns}
          data={transactionData}
          searchPlaceholder="Search transactions..."
        />
      </div>
    </div>
  )
}
