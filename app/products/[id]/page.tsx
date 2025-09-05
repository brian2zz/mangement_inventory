"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/data-table"
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
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "stockIn",
    header: "Stock In",
    cell: ({ row }) => {
      const stockIn = row.getValue("stockIn") as number
      return <Badge variant={stockIn > 0 ? "default" : "secondary"}>{stockIn}</Badge>
    },
  },
  {
    accessorKey: "stockOut",
    header: "Stock Out",
    cell: ({ row }) => {
      const stockOut = row.getValue("stockOut") as number
      return <Badge variant={stockOut > 0 ? "destructive" : "secondary"}>{stockOut}</Badge>
    },
  },
  {
    accessorKey: "destination",
    header: "Destination",
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
    cell: ({ row }) => {
      const stock = row.getValue("currentStock") as number
      return <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>{stock}</Badge>
    },
  },
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const [product, setProduct] = React.useState({
    cardNumber: "C001",
    productName: "Widget A",
    category: "Electronics",
    partNumber: "PN001",
    description: "High-quality electronic widget for industrial use",
    supplier: "Supplier ABC",
    unitPrice: "25.99",
    reorderLevel: "20",
    currentStock: "75",
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    alert("Product saved successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/products")
  }

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
            Product Details
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save"}
          </Button>
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
                  This action cannot be undone. This will permanently delete the product and remove all associated data.
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

      <div className="enhanced-card p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cardNumber" className="text-gray-700 font-medium">
                Card Number
              </Label>
              <Input
                id="cardNumber"
                value={product.cardNumber}
                onChange={(e) => setProduct({ ...product, cardNumber: e.target.value })}
                className="gradient-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productName" className="text-gray-700 font-medium">
                Product Name
              </Label>
              <Input
                id="productName"
                value={product.productName}
                onChange={(e) => setProduct({ ...product, productName: e.target.value })}
                className="gradient-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category" className="text-gray-700 font-medium">
                Category
              </Label>
              <Select value={product.category} onValueChange={(value) => setProduct({ ...product, category: value })}>
                <SelectTrigger className="gradient-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-sm border-pink-200">
                  <SelectItem value="Electronics" className="hover:bg-pink-50">
                    Electronics
                  </SelectItem>
                  <SelectItem value="Mechanical" className="hover:bg-pink-50">
                    Mechanical
                  </SelectItem>
                  <SelectItem value="Hardware" className="hover:bg-pink-50">
                    Hardware
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="partNumber" className="text-gray-700 font-medium">
                Part Number
              </Label>
              <Input
                id="partNumber"
                value={product.partNumber}
                onChange={(e) => setProduct({ ...product, partNumber: e.target.value })}
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
                className="gradient-input"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currentStock" className="text-gray-700 font-medium">
                Current Stock
              </Label>
              <Input
                id="currentStock"
                type="number"
                value={product.currentStock}
                onChange={(e) => setProduct({ ...product, currentStock: e.target.value })}
                className="gradient-input"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-2 mt-6">
          <Label htmlFor="description" className="text-gray-700 font-medium">
            Description
          </Label>
          <Textarea
            id="description"
            value={product.description}
            onChange={(e) => setProduct({ ...product, description: e.target.value })}
            rows={3}
            className="gradient-input resize-none"
          />
        </div>
      </div>

      <div className="enhanced-card p-6">
        <h2 className="text-2xl font-bold tracking-tight mb-4 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Transaction History
        </h2>
        <DataTable columns={transactionColumns} data={transactionData} searchPlaceholder="Search transactions..." />
      </div>
    </div>
  )
}
