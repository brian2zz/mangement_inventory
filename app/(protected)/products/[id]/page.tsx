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

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal"
import { apiFetch } from "@/lib/api"

/* ================== TYPES ================== */
interface Category {
  id: number
  categoryName: string
}

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  cardNumber?: string
  productName: string
  categoryId: number | null
  partNumber?: string
  description?: string
  supplierId?: number | null
  supplierName?: string
  unitPrice: number
  reorderLevel: number
  currentStock: number
}

/* ================== MAIN PAGE ================== */
export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)
  const [product, setProduct] = React.useState<Product | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false)

  /* ================== FETCH PRODUCT ================== */
  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiFetch(`/products/${id}`)
        const json = await res.json()
        if (json.success) setProduct(json.data)
      } catch (err) {
        console.error("Failed to fetch product", err)
      }
    }
    fetchProduct()
  }, [id])

  /* ================== FETCH CATEGORIES ================== */
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch("/categories?limit=100")
        const json = await res.json()
        if (json.success) setCategories(json.data)
      } catch (err) {
        console.error("Failed to fetch categories", err)
      }
    }
    fetchCategories()
  }, [])

  /* ================== SAVE ================== */
  const handleSave = async () => {
    if (!product) return

    setIsLoading(true)
    try {
      const res = await apiFetch(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          cardNumber: product.cardNumber,
          productName: product.productName,
          categoryId: product.categoryId,
          partNumber: product.partNumber,
          description: product.description,
          supplierId: product.supplierId,
          unitPrice: product.unitPrice,
          reorderLevel: product.reorderLevel,
          status: "active",
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Update failed")
      }

      alert("Product updated successfully")
    } catch (err) {
      console.error(err)
      alert("Failed to update product")
    } finally {
      setIsLoading(false)
    }
  }

  /* ================== DELETE ================== */
  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch(`/products/${id}`, { method: "DELETE" })
      const json = await res.json()

      if (!json.success) throw new Error(json.error)
      alert("Product deleted")
      router.push("/products")
    } catch (err) {
      console.error(err)
      alert("Failed to delete product")
    } finally {
      setIsLoading(false)
    }
  }

  if (!product)
    return <div className="p-6 text-center text-gray-500">Loading...</div>

  /* ================== RENDER ================== */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Product Detail
          </h1>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* PRODUCT INFO */}
      <div className="enhanced-card p-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label>Card Number</Label>
          <Input value={product.cardNumber || ""} onChange={(e) => setProduct({ ...product, cardNumber: e.target.value })} />

          <Label>Product Name</Label>
          <Input value={product.productName} onChange={(e) => setProduct({ ...product, productName: e.target.value })} />

          <Label>Category</Label>
          <Select
            value={product.categoryId ? String(product.categoryId) : ""}
            onValueChange={(v) => setProduct({ ...product, categoryId: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Part Number</Label>
          <Input value={product.partNumber || ""} onChange={(e) => setProduct({ ...product, partNumber: e.target.value })} />
        </div>

        <div className="space-y-4">
          <Label>Supplier</Label>
          <div className="flex gap-2">
            <Input value={product.supplierName || ""} readOnly />
            <Button onClick={() => setOpenSupplierModal(true)}>Select</Button>
          </div>

          <Label>Unit Price</Label>
          <Input type="number" value={product.unitPrice} onChange={(e) => setProduct({ ...product, unitPrice: Number(e.target.value) })} />

          <Label>Reorder Level</Label>
          <Input type="number" value={product.reorderLevel} onChange={(e) => setProduct({ ...product, reorderLevel: Number(e.target.value) })} />

          <Label>Current Stock</Label>
          <Input value={product.currentStock} readOnly />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="enhanced-card p-6">
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={product.description || ""}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
        />
      </div>

      {/* SUPPLIER MODAL */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={(s: Supplier) =>
          setProduct((p) =>
            p ? { ...p, supplierId: s.id, supplierName: s.name } : p
          )
        }
      />
    </div>
  )
}
