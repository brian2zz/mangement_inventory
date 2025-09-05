"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProductItem {
  id: string
  productName: string
  partNumber: string
  quantity: number
  unitPrice: number
  notes: string
}

// Mock product data for dropdown
const availableProducts = [
  { id: "1", name: "Widget A", partNumber: "PN001", unitPrice: 25.99 },
  { id: "2", name: "Widget B", partNumber: "PN002", unitPrice: 15.5 },
  { id: "3", name: "Widget C", partNumber: "PN003", unitPrice: 18.75 },
  { id: "4", name: "Component X", partNumber: "PN004", unitPrice: 8.75 },
  { id: "5", name: "Assembly Y", partNumber: "PN005", unitPrice: 45.0 },
  { id: "6", name: "Electronic Module Z", partNumber: "PN006", unitPrice: 32.25 },
]

export default function AddIncomingProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split("T")[0],
    supplier: "",
    notes: "",
    submitStatus: "Draft" as "Draft" | "Done",
  })

  const [items, setItems] = React.useState<ProductItem[]>([
    {
      id: "1",
      productName: "",
      partNumber: "",
      quantity: 0,
      unitPrice: 0,
      notes: "",
    },
  ])

  const addItem = () => {
    const newItem: ProductItem = {
      id: Date.now().toString(),
      productName: "",
      partNumber: "",
      quantity: 0,
      unitPrice: 0,
      notes: "",
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof ProductItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // Auto-fill part number and unit price when product is selected
          if (field === "productName") {
            const selectedProduct = availableProducts.find((p) => p.name === value)
            if (selectedProduct) {
              updatedItem.partNumber = selectedProduct.partNumber
              updatedItem.unitPrice = selectedProduct.unitPrice
            }
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.date) newErrors.date = "Date is required"
    if (!formData.supplier) newErrors.supplier = "Supplier is required"

    // Validate items
    items.forEach((item, index) => {
      if (!item.productName) newErrors[`item_${index}_product`] = "Product is required"
      if (item.quantity <= 0) newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateTotals = () => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    return { totalItems, totalValue }
  }

  const handleSave = async (status: "Draft" | "Done") => {
    if (!validateForm()) {
      alert("Please fix the validation errors before saving.")
      return
    }

    setIsLoading(true)

    const saveData = {
      ...formData,
      submitStatus: status,
      items: items.filter((item) => item.productName && item.quantity > 0),
      ...calculateTotals(),
    }

    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    alert(`Incoming product ${status.toLowerCase()} successfully!`)
    router.push("/incoming")
  }

  const { totalItems, totalValue } = calculateTotals()

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add Incoming Product
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handleSave("Draft")}
            disabled={isLoading}
            className="bg-white/80 hover:bg-white border-pink-200"
          >
            Save as Draft
          </Button>
          <Button onClick={() => handleSave("Done")} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-pink-600">{totalItems}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge variant={formData.submitStatus === "Done" ? "default" : "secondary"} className="mt-1">
            {formData.submitStatus}
          </Badge>
        </div>
      </div>

      {/* Transaction Information */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Transaction Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-gray-700 font-medium form-label-accent">
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`gradient-input ${errors.date ? "border-red-500" : ""}`}
                />
                {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplier" className="text-gray-700 font-medium form-label-accent">
                  Supplier *
                </Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                >
                  <SelectTrigger className={`gradient-input ${errors.supplier ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="Supplier ABC" className="hover:bg-pink-50">
                      Supplier ABC
                    </SelectItem>
                    <SelectItem value="Supplier XYZ" className="hover:bg-pink-50">
                      Supplier XYZ
                    </SelectItem>
                    <SelectItem value="Supplier DEF" className="hover:bg-pink-50">
                      Supplier DEF
                    </SelectItem>
                    <SelectItem value="Supplier GHI" className="hover:bg-pink-50">
                      Supplier GHI
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.supplier && <p className="text-red-500 text-sm">{errors.supplier}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="submitStatus" className="text-gray-700 font-medium form-label-accent">
                  Submit Status
                </Label>
                <Select
                  value={formData.submitStatus}
                  onValueChange={(value: "Draft" | "Done") => setFormData({ ...formData, submitStatus: value })}
                >
                  <SelectTrigger className="gradient-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="Draft" className="hover:bg-pink-50">
                      Draft
                    </SelectItem>
                    <SelectItem value="Done" className="hover:bg-pink-50">
                      Done
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-gray-700 font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes"
                  rows={3}
                  className="gradient-input resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-800">Products</CardTitle>
            <Button onClick={addItem} variant="outline" size="sm" className="btn-gradient border-0 bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border border-pink-200 rounded-lg bg-white/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Product {index + 1}</h4>
                {items.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="grid gap-2">
                  <Label className="text-gray-700 font-medium form-label-accent">Product *</Label>
                  <Select value={item.productName} onValueChange={(value) => updateItem(item.id, "productName", value)}>
                    <SelectTrigger
                      className={`gradient-input ${errors[`item_${index}_product`] ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                      {availableProducts.map((product) => (
                        <SelectItem key={product.id} value={product.name} className="hover:bg-pink-50">
                          {product.name} ({product.partNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[`item_${index}_product`] && (
                    <p className="text-red-500 text-sm">{errors[`item_${index}_product`]}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label className="text-gray-700 font-medium">Part Number</Label>
                  <Input
                    value={item.partNumber}
                    className="gradient-input bg-gray-50"
                    disabled
                    placeholder="Auto-filled"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-gray-700 font-medium form-label-accent">Quantity *</Label>
                  <Input
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="1"
                    className={`gradient-input ${errors[`item_${index}_quantity`] ? "border-red-500" : ""}`}
                  />
                  {errors[`item_${index}_quantity`] && (
                    <p className="text-red-500 text-sm">{errors[`item_${index}_quantity`]}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label className="text-gray-700 font-medium">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unitPrice || ""}
                    onChange={(e) => updateItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="gradient-input"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-gray-700 font-medium">Notes</Label>
                <Input
                  value={item.notes}
                  onChange={(e) => updateItem(item.id, "notes", e.target.value)}
                  placeholder="Optional notes for this product"
                  className="gradient-input"
                />
              </div>

              {item.quantity > 0 && item.unitPrice > 0 && (
                <div className="flex justify-end">
                  <div className="text-sm text-gray-600">
                    Subtotal:{" "}
                    <span className="font-medium text-green-600">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pb-6">
        <Button variant="outline" onClick={() => router.back()} className="bg-white/80 hover:bg-white border-pink-200">
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave("Draft")}
          disabled={isLoading}
          className="bg-white/80 hover:bg-white border-pink-200"
        >
          Save as Draft
        </Button>
        <Button onClick={() => handleSave("Done")} disabled={isLoading} className="btn-gradient border-0">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Submitting..." : "Submit Transaction"}
        </Button>
      </div>
    </div>
  )
}
