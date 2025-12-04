"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AddProductRequestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState({
    requestedItem: "",
    notes: "",
    requestedQuantity: 0,
    fulfilledQuantity: 0,
    requestDate: new Date().toISOString().split("T")[0],
    fulfilledDate: "",
    store: "",
    supplier: "",
    unitPrice: 0,
  })

  const totalPrice = formData.requestedQuantity * formData.unitPrice

  // VALIDATION
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.requestedItem) newErrors.requestedItem = "Requested item is required"
    if (formData.requestedQuantity <= 0) newErrors.requestedQuantity = "Quantity must be greater than 0"
    if (!formData.requestDate) newErrors.requestDate = "Request date is required"
    if (!formData.store) newErrors.store = "Store is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fix validation errors before submitting.")
      return
    }

    setIsLoading(true)

    const payload = {
      ...formData,
      totalPrice,
      status:
        formData.fulfilledQuantity === 0
          ? "Pending"
          : formData.fulfilledQuantity < formData.requestedQuantity
            ? "Partial"
            : "Fulfilled",
    }

    try {
      const res = await fetch("/api/product-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      alert("Product request created successfully!")
      router.push("/requests")
    } catch (err) {
      console.error(err)
      alert("Failed to create product request.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/80 border-pink-200"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add Product Request
          </h1>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()} className="bg-white/80 border-pink-200">
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS (unchanged) */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Requested Quantity</div>
          <div className="text-2xl font-bold text-blue-600">{formData.requestedQuantity}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Unit Price</div>
          <div className="text-2xl font-bold text-purple-600">${formData.unitPrice.toFixed(2)}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Price</div>
          <div className="text-2xl font-bold text-green-600">${totalPrice.toFixed(2)}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge className="mt-1">
            {formData.fulfilledQuantity === 0
              ? "Pending"
              : formData.fulfilledQuantity < formData.requestedQuantity
                ? "Partial"
                : "Fulfilled"}
          </Badge>
        </div>
      </div>

      {/* REQUEST INFORMATION (updated to match screenshot) */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-xl">Request Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* Row 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Requested Item */}
            <div className="grid gap-2">
              <Label>Requested Item *</Label>
              <Input
                value={formData.requestedItem}
                onChange={(e) => setFormData({ ...formData, requestedItem: e.target.value })}
                className={errors.requestedItem ? "border-red-500" : ""}
              />
              {errors.requestedItem && <p className="text-red-500 text-sm">{errors.requestedItem}</p>}
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Requested Quantity */}
            <div className="grid gap-2">
              <Label>Requested Quantity *</Label>
              <Input
                type="number"
                value={formData.requestedQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, requestedQuantity: Number(e.target.value) })
                }
                className={errors.requestedQuantity ? "border-red-500" : ""}
              />
              {errors.requestedQuantity && (
                <p className="text-red-500 text-sm">{errors.requestedQuantity}</p>
              )}
            </div>

            {/* Fulfilled Quantity */}
            <div className="grid gap-2">
              <Label>Fulfilled Quantity</Label>
              <Input
                type="number"
                value={formData.fulfilledQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, fulfilledQuantity: Number(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Request Date */}
            <div className="grid gap-2">
              <Label>Request Date *</Label>
              <Input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                className={errors.requestDate ? "border-red-500" : ""}
              />
              {errors.requestDate && <p className="text-red-500 text-sm">{errors.requestDate}</p>}
            </div>

            {/* Fulfilled Date */}
            <div className="grid gap-2">
              <Label>Fulfilled Date</Label>
              <Input
                type="date"
                value={formData.fulfilledDate}
                onChange={(e) => setFormData({ ...formData, fulfilledDate: e.target.value })}
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Store */}
            <div className="grid gap-2">
              <Label>Store *</Label>
              <Input
                value={formData.store}
                onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                className={errors.store ? "border-red-500" : ""}
              />
              {errors.store && <p className="text-red-500 text-sm">{errors.store}</p>}
            </div>

            {/* Supplier */}
            <div className="grid gap-2">
              <Label>Supplier</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>
          </div>

          {/* Row 5 */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Unit Price */}
            <div className="grid gap-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: Number(e.target.value) })
                }
              />
            </div>

            {/* Total Price */}
            <div className="grid gap-2">
              <Label>Total Price</Label>
              <Input value={totalPrice.toFixed(2)} readOnly className="bg-gray-100" />
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  )
}
