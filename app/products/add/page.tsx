"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AddProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const [product, setProduct] = React.useState({
    cardNumber: "",
    productName: "",
    category: "",
    partNumber: "",
    description: "",
    supplier: "",
    unitPrice: "",
    reorderLevel: "",
    initialStock: "",
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    alert("Product added successfully!")
    router.push("/products")
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Product Information</CardTitle>
        </CardHeader>
        <CardContent>
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
                Add New Product
              </h1>
            </div>
            <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="cardNumber" className="text-gray-700 font-medium form-label-accent">
                  Card Number *
                </Label>
                <Input
                  id="cardNumber"
                  value={product.cardNumber}
                  onChange={(e) => setProduct({ ...product, cardNumber: e.target.value })}
                  placeholder="Enter card number"
                  className="gradient-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productName" className="text-gray-700 font-medium form-label-accent">
                  Product Name *
                </Label>
                <Input
                  id="productName"
                  value={product.productName}
                  onChange={(e) => setProduct({ ...product, productName: e.target.value })}
                  placeholder="Enter product name"
                  className="gradient-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category" className="text-gray-700 font-medium form-label-accent">
                  Category *
                </Label>
                <Select
                  value={product.category}
                  onValueChange={(value) => setProduct({ ...product, category: value })}
                  className="gradient-input"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partNumber" className="text-gray-700 font-medium form-label-accent">
                  Part Number *
                </Label>
                <Input
                  id="partNumber"
                  value={product.partNumber}
                  onChange={(e) => setProduct({ ...product, partNumber: e.target.value })}
                  placeholder="Enter part number"
                  className="gradient-input"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier" className="text-gray-700 font-medium">
                  Supplier
                </Label>
                <Input
                  id="supplier"
                  value={product.supplier}
                  onChange={(e) => setProduct({ ...product, supplier: e.target.value })}
                  placeholder="Enter supplier name"
                  className="gradient-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitPrice" className="text-gray-700 font-medium">
                  Unit Price
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={product.unitPrice}
                  onChange={(e) => setProduct({ ...product, unitPrice: e.target.value })}
                  placeholder="0.00"
                  className="gradient-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reorderLevel" className="text-gray-700 font-medium">
                  Reorder Level
                </Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={product.reorderLevel}
                  onChange={(e) => setProduct({ ...product, reorderLevel: e.target.value })}
                  placeholder="Enter reorder level"
                  className="gradient-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="initialStock" className="text-gray-700 font-medium">
                  Initial Stock
                </Label>
                <Input
                  id="initialStock"
                  type="number"
                  value={product.initialStock}
                  onChange={(e) => setProduct({ ...product, initialStock: e.target.value })}
                  placeholder="Enter initial stock quantity"
                  className="gradient-input"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-gray-700 font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={product.description}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              placeholder="Enter product description"
              rows={3}
              className="gradient-input"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
