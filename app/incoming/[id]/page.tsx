"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Edit, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

// Mock existing product items
const mockProductItems: ProductItem[] = [
  {
    id: "1",
    productName: "Widget A",
    partNumber: "PN001",
    quantity: 50,
    unitPrice: 25.99,
    notes: "Initial stock order",
  },
  {
    id: "2",
    productName: "Widget B",
    partNumber: "PN002",
    quantity: 30,
    unitPrice: 15.5,
    notes: "Backup inventory",
  },
  {
    id: "3",
    productName: "Component X",
    partNumber: "PN004",
    quantity: 20,
    unitPrice: 8.75,
    notes: "Special components",
  },
]

export default function IncomingProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [incomingProduct, setIncomingProduct] = React.useState({
    id: params.id as string,
    date: "2024-01-15",
    supplier: "Supplier ABC",
    notes: "Monthly stock replenishment",
    submitStatus: "Done" as "Draft" | "Done",
  })

  const [items, setItems] = React.useState<ProductItem[]>(mockProductItems)

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

    if (!incomingProduct.date) newErrors.date = "Date is required"
    if (!incomingProduct.supplier) newErrors.supplier = "Supplier is required"

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

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fix the validation errors before saving.")
      return
    }

    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsEditing(false)
    alert("Incoming product updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
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
            Incoming Product Details
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="btn-gradient border-0">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="bg-white/80 hover:bg-white border-pink-200"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </>
          )}
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
            <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-800">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">
                  This action cannot be undone. This will permanently delete the incoming product record and remove all
                  associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white hover:bg-gray-50 border-pink-200">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
          <Badge variant={incomingProduct.submitStatus === "Done" ? "default" : "secondary"} className="mt-1">
            {incomingProduct.submitStatus}
          </Badge>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Date</div>
          <div className="text-lg font-medium text-gray-800">{incomingProduct.date}</div>
        </div>
      </div>

      {/* Details Form */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Incoming Product Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-gray-700 font-medium form-label-accent">
                Date {isEditing && "*"}
              </Label>
              <Input
                id="date"
                type="date"
                value={incomingProduct.date}
                onChange={(e) => setIncomingProduct({ ...incomingProduct, date: e.target.value })}
                className={`gradient-input ${errors.date ? "border-red-500" : ""}`}
                disabled={!isEditing}
              />
              {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplier" className="text-gray-700 font-medium form-label-accent">
                Supplier {isEditing && "*"}
              </Label>
              {isEditing ? (
                <Select
                  value={incomingProduct.supplier}
                  onValueChange={(value) => setIncomingProduct({ ...incomingProduct, supplier: value })}
                >
                  <SelectTrigger className={`gradient-input ${errors.supplier ? "border-red-500" : ""}`}>
                    <SelectValue />
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
              ) : (
                <Input value={incomingProduct.supplier} className="gradient-input" disabled />
              )}
              {errors.supplier && <p className="text-red-500 text-sm">{errors.supplier}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="status" className="text-gray-700 font-medium form-label-accent">
                Status
              </Label>
              {isEditing ? (
                <Select
                  value={incomingProduct.submitStatus}
                  onValueChange={(value: "Draft" | "Done") =>
                    setIncomingProduct({ ...incomingProduct, submitStatus: value })
                  }
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
              ) : (
                <div className="p-2">
                  <Badge variant={incomingProduct.submitStatus === "Done" ? "default" : "secondary"}>
                    {incomingProduct.submitStatus}
                  </Badge>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-gray-700 font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={incomingProduct.notes}
                onChange={(e) => setIncomingProduct({ ...incomingProduct, notes: e.target.value })}
                rows={3}
                className="gradient-input resize-none"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Items */}
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-gray-800">Product Items</CardTitle>
            {isEditing && (
              <Button onClick={addItem} variant="outline" size="sm" className="btn-gradient border-0 bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border border-pink-200 rounded-lg bg-white/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">Product {index + 1}</h4>
                {isEditing && items.length > 1 && (
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
                  <Label className="text-gray-700 font-medium form-label-accent">Product {isEditing && "*"}</Label>
                  {isEditing ? (
                    <Select
                      value={item.productName}
                      onValueChange={(value) => updateItem(item.id, "productName", value)}
                    >
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
                  ) : (
                    <Input value={item.productName} className="gradient-input" disabled />
                  )}
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
                  <Label className="text-gray-700 font-medium form-label-accent">Quantity {isEditing && "*"}</Label>
                  <Input
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="1"
                    className={`gradient-input ${errors[`item_${index}_quantity`] ? "border-red-500" : ""}`}
                    disabled={!isEditing}
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
                    disabled={!isEditing}
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
                  disabled={!isEditing}
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
    </div>
  )
}
