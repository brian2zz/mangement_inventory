"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AddProductRequestPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState({
    requestedItem: "",
    requestedQuantity: 0,
    requestDate: new Date().toISOString().split("T")[0],
    store: "",
    unitPrice: 0,
    priority: "Normal" as "Low" | "Normal" | "High" | "Urgent",
    requestedBy: "",
    notes: "",
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.requestedItem) newErrors.requestedItem = "Requested item is required"
    if (formData.requestedQuantity <= 0) newErrors.requestedQuantity = "Quantity must be greater than 0"
    if (!formData.requestDate) newErrors.requestDate = "Request date is required"
    if (!formData.store) newErrors.store = "Store is required"
    if (!formData.requestedBy) newErrors.requestedBy = "Requested by is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      alert("Please fix the validation errors before saving.")
      return
    }

    setIsLoading(true)

    const saveData = {
      ...formData,
      totalPrice: formData.requestedQuantity * formData.unitPrice,
      status: "Pending",
      fulfilledQuantity: 0,
      fulfilledDate: "",
    }

    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    alert("Product request submitted successfully!")
    router.push("/requests")
  }

  const totalPrice = formData.requestedQuantity * formData.unitPrice

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
            Add Product Request
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
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
          <div className="text-sm text-gray-600">Priority</div>
          <Badge
            variant={
              formData.priority === "Urgent" ? "destructive" : formData.priority === "High" ? "secondary" : "default"
            }
            className="mt-1"
          >
            {formData.priority}
          </Badge>
        </div>
      </div>

      {/* Request Information */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Request Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="requestedItem" className="text-gray-700 font-medium form-label-accent">
                  Requested Item *
                </Label>
                <Select
                  value={formData.requestedItem}
                  onValueChange={(value) => setFormData({ ...formData, requestedItem: value })}
                >
                  <SelectTrigger className={`gradient-input ${errors.requestedItem ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select product to request" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="Widget A" className="hover:bg-pink-50">
                      Widget A (PN001)
                    </SelectItem>
                    <SelectItem value="Widget B" className="hover:bg-pink-50">
                      Widget B (PN002)
                    </SelectItem>
                    <SelectItem value="Widget C" className="hover:bg-pink-50">
                      Widget C (PN003)
                    </SelectItem>
                    <SelectItem value="Component X" className="hover:bg-pink-50">
                      Component X (PN004)
                    </SelectItem>
                    <SelectItem value="Assembly Y" className="hover:bg-pink-50">
                      Assembly Y (PN005)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.requestedItem && <p className="text-red-500 text-sm">{errors.requestedItem}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="requestedQuantity" className="text-gray-700 font-medium form-label-accent">
                  Requested Quantity *
                </Label>
                <Input
                  id="requestedQuantity"
                  type="number"
                  value={formData.requestedQuantity || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, requestedQuantity: Number.parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                  min="1"
                  className={`gradient-input ${errors.requestedQuantity ? "border-red-500" : ""}`}
                />
                {errors.requestedQuantity && <p className="text-red-500 text-sm">{errors.requestedQuantity}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="requestDate" className="text-gray-700 font-medium form-label-accent">
                  Request Date *
                </Label>
                <Input
                  id="requestDate"
                  type="date"
                  value={formData.requestDate}
                  onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                  className={`gradient-input ${errors.requestDate ? "border-red-500" : ""}`}
                />
                {errors.requestDate && <p className="text-red-500 text-sm">{errors.requestDate}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="store" className="text-gray-700 font-medium form-label-accent">
                  Store *
                </Label>
                <Select value={formData.store} onValueChange={(value) => setFormData({ ...formData, store: value })}>
                  <SelectTrigger className={`gradient-input ${errors.store ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="Select requesting store" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="Store A" className="hover:bg-pink-50">
                      Store A
                    </SelectItem>
                    <SelectItem value="Store B" className="hover:bg-pink-50">
                      Store B
                    </SelectItem>
                    <SelectItem value="Store C" className="hover:bg-pink-50">
                      Store C
                    </SelectItem>
                    <SelectItem value="Main Branch" className="hover:bg-pink-50">
                      Main Branch
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.store && <p className="text-red-500 text-sm">{errors.store}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="unitPrice" className="text-gray-700 font-medium">
                  Unit Price
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice || ""}
                  onChange={(e) => setFormData({ ...formData, unitPrice: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="gradient-input"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-gray-700 font-medium form-label-accent">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "Low" | "Normal" | "High" | "Urgent") =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger className="gradient-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                    <SelectItem value="Low" className="hover:bg-pink-50">
                      Low
                    </SelectItem>
                    <SelectItem value="Normal" className="hover:bg-pink-50">
                      Normal
                    </SelectItem>
                    <SelectItem value="High" className="hover:bg-pink-50">
                      High
                    </SelectItem>
                    <SelectItem value="Urgent" className="hover:bg-pink-50">
                      Urgent
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="requestedBy" className="text-gray-700 font-medium form-label-accent">
                  Requested By *
                </Label>
                <Input
                  id="requestedBy"
                  value={formData.requestedBy}
                  onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                  placeholder="Enter requester name"
                  className={`gradient-input ${errors.requestedBy ? "border-red-500" : ""}`}
                />
                {errors.requestedBy && <p className="text-red-500 text-sm">{errors.requestedBy}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-gray-700 font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes or requirements"
                  rows={3}
                  className="gradient-input resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pb-6">
        <Button variant="outline" onClick={() => router.back()} className="bg-white/80 hover:bg-white border-pink-200">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Submitting..." : "Submit Request"}
        </Button>
      </div>
    </div>
  )
}
