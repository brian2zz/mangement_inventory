"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"

interface Item {
  id: string
  product_name: string
  requested_quantity: number
  fulfilled_quantity: number
  unit_price: number
}

export default function AddProductRequestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  /* ================= HEADER ================= */
  const [formData, setFormData] = React.useState({
    requestDate: new Date().toISOString().split("T")[0],
    fulfilledDate: "",
    store: "",
    supplier: "",
    notes: "",
  })

  /* ================= ITEMS ================= */
  const [items, setItems] = React.useState<Item[]>([
    {
      id: Date.now().toString(),
      product_name: "",
      requested_quantity: 0,
      fulfilled_quantity: 0,
      unit_price: 0,
    },
  ])

  /* ================= ITEM HANDLERS ================= */
  const addItem = () => {
    setItems((p) => [
      ...p,
      {
        id: Date.now().toString(),
        product_name: "",
        requested_quantity: 0,
        fulfilled_quantity: 0,
        unit_price: 0,
      },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems((p) => p.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, field: keyof Item, value: number | string) => {
    setItems((p) =>
      p.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )
  }

  /* ================= TOTALS ================= */
  const totalRequestedQty = items.reduce(
    (s, i) => s + (Number(i.requested_quantity) || 0),
    0
  )

  const totalFulfilledQty = items.reduce(
    (s, i) => s + (Number(i.fulfilled_quantity) || 0),
    0
  )

  // 🔥 TOTAL PRICE = fulfilled_quantity * unit_price
  const totalPrice = items.reduce(
    (s, i) =>
      s + (Number(i.fulfilled_quantity) || 0) * (Number(i.unit_price) || 0),
    0
  )

  const status =
    totalFulfilledQty === 0
      ? "Pending"
      : totalFulfilledQty < totalRequestedQty
        ? "Partial"
        : "Fulfilled"

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    const e: Record<string, string> = {}

    if (!formData.requestDate) e.requestDate = "Request date is required"
    if (!formData.store) e.store = "Store is required"

    items.forEach((i, idx) => {
      if (!i.product_name)
        e[`item_${idx}_product`] = "Product name is required"
      if (i.requested_quantity <= 0)
        e[`item_${idx}_qty`] = "Requested qty must be > 0"
      if (i.fulfilled_quantity < 0)
        e[`item_${idx}_fulfilled`] = "Fulfilled qty invalid"
    })

    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fix validation errors")
      return
    }

    setIsLoading(true)

    const payload = {
      requestDate: formData.requestDate,
      fulfilledDate: formData.fulfilledDate || null,
      store: formData.store,
      supplier: formData.supplier || null,
      notes: formData.notes || null,
      status,
      items: items.map((i) => ({
        product_name: i.product_name,
        requested_quantity: i.requested_quantity,
        fulfilled_quantity: i.fulfilled_quantity,
        unit_price: i.unit_price,
        // 🔥 subtotal pakai fulfilled
        total_price: i.fulfilled_quantity * i.unit_price,
      })),
    }

    try {
      const res = await apiFetch("/product-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      alert("Product request created successfully!")
      router.push("/requests")
    } catch (err) {
      console.error(err)
      alert("Failed to create product request")
    } finally {
      setIsLoading(false)
    }
  }

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add Product Request
          </h1>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Requested Qty</div>
          <div className="text-2xl font-bold">{totalRequestedQty}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Fulfilled Qty</div>
          <div className="text-2xl font-bold">{totalFulfilledQty}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Price</div>
          <div className="text-2xl font-bold">{formatRupiah(totalPrice)}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge>{status}</Badge>
        </div>
      </div>

      {/* REQUEST INFORMATION */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Request Date *</Label>
              <Input
                type="date"
                value={formData.requestDate}
                onChange={(e) =>
                  setFormData({ ...formData, requestDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Fulfilled Date</Label>
              <Input
                type="date"
                value={formData.fulfilledDate}
                onChange={(e) =>
                  setFormData({ ...formData, fulfilledDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Store *</Label>
              <Input
                value={formData.store}
                onChange={(e) =>
                  setFormData({ ...formData, store: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Supplier</Label>
              <Input
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ITEMS */}
      <Card className="enhanced-card">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Items</CardTitle>
          <Button size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="border p-4 rounded-lg space-y-4">
              <div className="flex justify-between">
                <h4 className="font-medium">Item {idx + 1}</h4>
                {items.length > 1 && (
                  <Button size="icon" variant="outline" onClick={() => removeItem(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Product *</Label>
                  <Input
                    value={item.product_name}
                    onChange={(e) =>
                      updateItem(item.id, "product_name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Requested Qty *</Label>
                  <Input
                    type="number"
                    value={item.requested_quantity}
                    onFocus={(e) => {
                      if (item.requested_quantity === 0) {
                        updateItem(item.id, "requested_quantity", "")
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        updateItem(item.id, "requested_quantity", 0)
                      }
                    }}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "requested_quantity",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                </div>

                <div>
                  <Label>Fulfilled Qty</Label>
                  <Input
                    type="number"
                    value={item.fulfilled_quantity}
                    onFocus={() => {
                      if (item.fulfilled_quantity === 0) {
                        updateItem(item.id, "fulfilled_quantity", "")
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        updateItem(item.id, "fulfilled_quantity", 0)
                      }
                    }}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "fulfilled_quantity",
                        Number(e.target.value || 0)
                      )
                    }
                  />

                </div>

                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onFocus={() => {
                      if (item.unit_price === 0) {
                        updateItem(item.id, "unit_price", "")
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        updateItem(item.id, "unit_price", 0)
                      }
                    }}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "unit_price",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                </div>
              </div>

              {/* 🔥 SUBTOTAL (FULFILLED * PRICE) */}
              <div className="text-right text-sm">
                Subtotal:{" "}
                <span className="font-medium">
                  {formatRupiah(item.fulfilled_quantity * item.unit_price)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
