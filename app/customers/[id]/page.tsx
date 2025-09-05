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

interface Order {
  id: string
  orderDate: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: "Pending" | "Shipped" | "Delivered"
}

const mockOrders: Order[] = [
  {
    id: "1",
    orderDate: "2024-01-17",
    productName: "Widget A",
    quantity: 25,
    unitPrice: 25.99,
    totalPrice: 649.75,
    status: "Delivered",
  },
  {
    id: "2",
    orderDate: "2024-01-19",
    productName: "Widget B",
    quantity: 10,
    unitPrice: 15.5,
    totalPrice: 155.0,
    status: "Shipped",
  },
]

const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderDate",
    header: "Order Date",
  },
  {
    accessorKey: "productName",
    header: "Product Name",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const quantity = row.getValue("quantity") as number
      return <Badge variant="default">{quantity}</Badge>
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
    accessorKey: "totalPrice",
    header: "Total Price",
    cell: ({ row }) => {
      const price = row.getValue("totalPrice") as number
      return `$${price.toFixed(2)}`
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge variant={status === "Delivered" ? "default" : status === "Shipped" ? "secondary" : "destructive"}>
          {status}
        </Badge>
      )
    },
  },
]

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  const [customer, setCustomer] = React.useState({
    id: params.id as string,
    customerName: "ABC Corporation",
    phoneNumber: "+1 (555) 111-2222",
    email: "contact@abccorp.com",
    address: "100 Business Park, City, State 12345",
    contactPerson: "Sarah Johnson",
    website: "www.abccorp.com",
    taxId: "TAX987654321",
    paymentTerms: "Net 15",
    notes: "Preferred customer with excellent payment history",
    totalOrders: 25,
    totalValue: 15750.25,
    lastOrderDate: "2024-01-19",
    customerSince: "2023-06-15",
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsEditing(false)
    alert("Customer updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/customers")
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
            Customer Details
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
                  This action cannot be undone. This will permanently delete the customer and all associated data.
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
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-pink-600">{customer.totalOrders}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-green-600">${customer.totalValue.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Last Order</div>
          <div className="text-lg font-medium text-gray-800">{customer.lastOrderDate}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Customer Since</div>
          <div className="text-lg font-medium text-gray-800">{customer.customerSince}</div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName" className="text-gray-700 font-medium">
                Customer Name
              </Label>
              <Input
                id="customerName"
                value={customer.customerName}
                onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
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
                value={customer.contactPerson}
                onChange={(e) => setCustomer({ ...customer, contactPerson: e.target.value })}
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
                  value={customer.phoneNumber}
                  onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
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
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
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
                value={customer.website}
                onChange={(e) => setCustomer({ ...customer, website: e.target.value })}
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
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
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
                value={customer.taxId}
                onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })}
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
                value={customer.paymentTerms}
                onChange={(e) => setCustomer({ ...customer, paymentTerms: e.target.value })}
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
                value={customer.notes}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                rows={3}
                className="gradient-input resize-none"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Order History</h2>
        <DataTable columns={orderColumns} data={mockOrders} searchPlaceholder="Search orders..." />
      </div>
    </div>
  )
}
