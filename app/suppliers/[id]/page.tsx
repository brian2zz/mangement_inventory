"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, Save, Trash2, Edit, Phone, Mail, MapPin } from "lucide-react"

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
  category: string
  unitPrice: number
  lastOrderDate: string
  totalOrdered: number
}

const mockProducts: Product[] = [
  {
    id: "1",
    productName: "Widget A",
    partNumber: "PN001",
    category: "Electronics",
    unitPrice: 25.99,
    lastOrderDate: "2024-01-15",
    totalOrdered: 500,
  },
  {
    id: "2",
    productName: "Component X",
    partNumber: "PN004",
    category: "Hardware",
    unitPrice: 8.75,
    lastOrderDate: "2024-01-20",
    totalOrdered: 300,
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
    accessorKey: "category",
    header: "Category",
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
    accessorKey: "lastOrderDate",
    header: "Last Order",
  },
  {
    accessorKey: "totalOrdered",
    header: "Total Ordered",
    cell: ({ row }) => {
      const total = row.getValue("totalOrdered") as number
      return <Badge variant="default">{total}</Badge>
    },
  },
]

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  const [supplier, setSupplier] = React.useState({
    id: params.id as string,
    supplierName: "Supplier ABC",
    phoneNumber: "+1 (555) 123-4567",
    email: "contact@supplierabc.com",
    address: "123 Industrial Ave, City, State 12345",
    contactPerson: "John Smith",
    website: "www.supplierabc.com",
    taxId: "TAX123456789",
    paymentTerms: "Net 30",
    notes: "Reliable supplier with good quality products and on-time delivery",
    totalProducts: 15,
    totalOrders: 45,
    totalValue: 25750.5,
    rating: 4.5,
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsEditing(false)
    alert("Supplier updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/suppliers")
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
            Supplier Details
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
                  This action cannot be undone. This will permanently delete the supplier and all associated data.
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
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold text-pink-600">{supplier.totalProducts}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-blue-600">{supplier.totalOrders}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-green-600">${supplier.totalValue.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Rating</div>
          <div className="text-2xl font-bold text-yellow-600">{supplier.rating}/5</div>
        </div>
      </div>

      {/* Supplier Details */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Supplier Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="supplierName" className="text-gray-700 font-medium">
                Supplier Name
              </Label>
              <Input
                id="supplierName"
                value={supplier.supplierName}
                onChange={(e) => setSupplier({ ...supplier, supplierName: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson" className="text-gray-700 font-medium">
                Contact Person
              </Label>
              <Input
                id="contactPerson"
                value={supplier.contactPerson}
                onChange={(e) => setSupplier({ ...supplier, contactPerson: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber" className="text-gray-700 font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Input
                  id="phoneNumber"
                  value={supplier.phoneNumber}
                  onChange={(e) => setSupplier({ ...supplier, phoneNumber: e.target.value })}
                  className="pl-10 gradient-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Input
                  id="email"
                  type="email"
                  value={supplier.email}
                  onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                  className="pl-10 gradient-input"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website" className="text-gray-700 font-medium">
                Website
              </Label>
              <Input
                id="website"
                value={supplier.website}
                onChange={(e) => setSupplier({ ...supplier, website: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="address" className="text-gray-700 font-medium">
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-pink-400" />
                <Textarea
                  id="address"
                  value={supplier.address}
                  onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
                  rows={3}
                  className="pl-10 gradient-input resize-none"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxId" className="text-gray-700 font-medium">
                Tax ID
              </Label>
              <Input
                id="taxId"
                value={supplier.taxId}
                onChange={(e) => setSupplier({ ...supplier, taxId: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentTerms" className="text-gray-700 font-medium">
                Payment Terms
              </Label>
              <Input
                id="paymentTerms"
                value={supplier.paymentTerms}
                onChange={(e) => setSupplier({ ...supplier, paymentTerms: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-gray-700 font-medium">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={supplier.notes}
                onChange={(e) => setSupplier({ ...supplier, notes: e.target.value })}
                rows={3}
                className="gradient-input resize-none"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products from Supplier */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Products from this Supplier</h2>
        <DataTable columns={productColumns} data={mockProducts} searchPlaceholder="Search products..." />
      </div>
    </div>
  )
}
