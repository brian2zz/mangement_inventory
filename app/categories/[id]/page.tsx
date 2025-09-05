"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, Save, Trash2, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface Product {
  id: string
  productName: string
  partNumber: string
  stock: number
  unitPrice: number
  supplier: string
}

const mockProducts: Product[] = [
  {
    id: "1",
    productName: "Widget A",
    partNumber: "PN001",
    stock: 75,
    unitPrice: 25.99,
    supplier: "Supplier ABC",
  },
  {
    id: "2",
    productName: "Widget C",
    partNumber: "PN003",
    stock: 200,
    unitPrice: 18.5,
    supplier: "Supplier DEF",
  },
  {
    id: "3",
    productName: "Electronic Component E1",
    partNumber: "PN005",
    stock: 150,
    unitPrice: 12.75,
    supplier: "Supplier ABC",
  },
]

const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "productName",
    header: "Product Name",
  },
  {
    accessorKey: "partNumber",
    header: "Part Number",
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      return <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>{stock}</Badge>
    },
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("unitPrice") as number
      return `$${price.toFixed(2)}`
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
  },
]

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  const [category, setCategory] = React.useState({
    id: params.id as string,
    categoryName: "Electronics",
    description: "Electronic components and devices for various applications",
    productCount: 45,
    totalValue: 15750.25,
    createdDate: "2024-01-01",
    lastUpdated: "2024-01-15",
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsEditing(false)
    alert("Category updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/categories")
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
            Category Details
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
                  This action cannot be undone. This will permanently delete the category and all associated products
                  will be uncategorized.
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
          <div className="text-sm text-gray-600">Product Count</div>
          <div className="text-2xl font-bold text-pink-600">{category.productCount}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-green-600">${category.totalValue.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Created Date</div>
          <div className="text-lg font-medium text-gray-800">{category.createdDate}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Last Updated</div>
          <div className="text-lg font-medium text-gray-800">{category.lastUpdated}</div>
        </div>
      </div>

      {/* Category Details */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Category Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryName" className="text-gray-700 font-medium">
                Category Name
              </Label>
              <Input
                id="categoryName"
                value={category.categoryName}
                onChange={(e) => setCategory({ ...category, categoryName: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="createdDate" className="text-gray-700 font-medium">
                Created Date
              </Label>
              <Input
                id="createdDate"
                type="date"
                value={category.createdDate}
                onChange={(e) => setCategory({ ...category, createdDate: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-gray-700 font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={category.description}
                onChange={(e) => setCategory({ ...category, description: e.target.value })}
                rows={4}
                className="gradient-input resize-none"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products in Category */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Products in this Category</h2>
        <DataTable columns={productColumns} data={mockProducts} searchPlaceholder="Search products..." />
      </div>
    </div>
  )
}
