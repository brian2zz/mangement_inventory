"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

import ProductSelectModal from "@/components/selectors/ProductSelectModal"
import { apiFetch } from "@/lib/api"

/* ======================================================
   TYPES
====================================================== */
interface Product {
  id: number
  productName: string
  stock: number
}

/* ======================================================
   PAGE
====================================================== */
export default function AddInventoryAdjustmentPage() {
  const router = useRouter()
  const [openProductModal, setOpenProductModal] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const [form, setForm] = React.useState({
    productId: null as number | null,
    productName: "",
    currentStock: 0,      // 👈 stock lama
    newStock: "",         // 👈 stock baru (input user)
    adjustmentType: "" as "Increase" | "Decrease" | "",
    quantity: 0,          // 👈 selisih
    notes: "",
  })

  /* ======================================================
     AUTO DETECT IN / OUT
  ====================================================== */
  React.useEffect(() => {
    if (!form.productId) return
    if (form.newStock === "") {
      setForm((f) => ({ ...f, adjustmentType: "", quantity: 0 }))
      return
    }

    const newStock = Number(form.newStock)
    const oldStock = form.currentStock

    if (newStock === oldStock) {
      setForm((f) => ({ ...f, adjustmentType: "", quantity: 0 }))
      return
    }

    if (newStock > oldStock) {
      setForm((f) => ({
        ...f,
        adjustmentType: "Increase",
        quantity: newStock - oldStock,
      }))
    } else {
      setForm((f) => ({
        ...f,
        adjustmentType: "Decrease",
        quantity: oldStock - newStock,
      }))
    }
  }, [form.newStock, form.productId])

  /* ======================================================
     SUBMIT
  ====================================================== */
  const submit = async () => {
    if (!form.productId) return alert("Product is required")
    if (form.newStock === "") return alert("New stock is required")
    if (Number(form.newStock) < 0) return alert("Stock cannot be negative")
    if (form.quantity === 0) return alert("Stock is unchanged")
    if (!form.notes.trim()) return alert("Reason is required")

    setIsLoading(true)

    try {
      const res = await apiFetch("/inventory-adjustments", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          newStock: Number(form.newStock),
          notes: form.notes,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save adjustment")
      }

      alert("Inventory adjustment saved")
      router.push("/adjustment")
    } catch (err) {
      console.error(err)
      alert("Failed to save inventory adjustment")
    } finally {
      setIsLoading(false)
    }
  }

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            New Inventory Adjustment
          </h1>
        </div>

        <Button onClick={submit} disabled={isLoading} className="btn-gradient">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* FORM */}
      <Card className="enhanced-card ">
        <CardContent className="space-y-4">
          {/* PRODUCT */}
          <div className="space-y-2">
            <Label>Product *</Label>
            <Input
              value={form.productName}
              readOnly
              placeholder="Select product"
              onClick={() => setOpenProductModal(true)}
            />
          </div>

          {/* OLD STOCK */}
          <div className="space-y-2">
            <Label>Stock Lama</Label>
            <Input value={form.currentStock} disabled />
          </div>

          {/* NEW STOCK */}
          <div className="space-y-2">
            <Label>Stock Baru *</Label>
            <Input
              type="number"
              min={0}
              value={form.newStock}
              onChange={(e) =>
                setForm((f) => ({ ...f, newStock: e.target.value }))
              }
            />
          </div>

          {/* AUTO RESULT */}
          {form.adjustmentType && (
            <div className="text-sm font-medium">
              {form.adjustmentType === "Increase" ? "IN" : "OUT"}{" "}
              <span className="text-pink-600">
                ({form.quantity})
              </span>
            </div>
          )}

          {/* NOTES */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* PRODUCT MODAL */}
      <ProductSelectModal
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        onSelect={(p: Product) => {
          setForm((f) => ({
            ...f,
            productId: p.id,
            productName: p.productName,
            currentStock: p.stock,
            newStock: "",        // 👈 BIAR USER INPUT
            adjustmentType: "",
            quantity: 0,
          }))
          setOpenProductModal(false)
        }}
      />
    </div>
  )
}
