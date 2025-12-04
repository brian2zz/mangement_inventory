"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Edit, Phone, Mail, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataTableV2 as DataTable } from "@/components/data-table"
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

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [customer, setCustomer] = React.useState<any>(null)

  // 🔹 Fetch data customer dari backend
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/customers/${params.id}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error || "Failed to load customer")
        setCustomer(json.data)
      } catch (err: any) {
        alert(`❌ ${err.message}`)
        router.push("/customers")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  // ✏️ Simpan perubahan (PUT)
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          contactPerson: customer.contactPerson,
          status: customer.status,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || "Failed to update customer")
      alert("✅ Customer updated successfully!")
      setIsEditing(false)
    } catch (err: any) {
      alert(`❌ ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 🗑️ Hapus customer
  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${params.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || "Failed to delete")
      alert("🗑️ Customer deleted successfully!")
      router.push("/customers")
    } catch (err: any) {
      alert(`❌ ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading customer details...
      </div>
    )

  if (!customer)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600">
        Customer not found.
        <Button onClick={() => router.push("/customers")} className="mt-4">
          Back
        </Button>
      </div>
    )

  // ⚙️ Kolom order tetap dummy
  const orderColumns = [
    { accessorKey: "orderDate", header: "Order Date" },
    { accessorKey: "productName", header: "Product Name" },
    { accessorKey: "quantity", header: "Quantity" },
    { accessorKey: "unitPrice", header: "Unit Price" },
    { accessorKey: "totalPrice", header: "Total Price" },
    { accessorKey: "status", header: "Status" },
  ]

  // ✨ Default fallback untuk summary cards (karena belum ada di DB)
  const safeTotalOrders = customer.totalOrders ?? 0
  const safeTotalValue = customer.totalValue ?? 0
  const safeLastOrder = customer.lastOrderDate ?? "-"
  const safeCustomerSince =
    customer.createdAt ? new Date(customer.createdAt).toISOString().split("T")[0] : "-"

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200"
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
              <Button onClick={handleSave} disabled={saving} className="btn-gradient border-0">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={saving}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this customer and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border-pink-200">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 🔹 Summary Cards (kembali seperti versi kamu) */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-pink-600">{safeTotalOrders}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-green-600">
            ${safeTotalValue.toFixed(2)}
          </div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Last Order</div>
          <div className="text-lg font-medium text-gray-800">{safeLastOrder}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Customer Since</div>
          <div className="text-lg font-medium text-gray-800">{safeCustomerSince}</div>
        </div>
      </div>

      {/* Customer Information (tetap sama) */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Customer Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="Customer Name" value={customer.name} disabled={!isEditing} onChange={(v) => setCustomer({ ...customer, name: v })} />
            <Field label="Contact Person" value={customer.contactPerson || ""} disabled={!isEditing} onChange={(v) => setCustomer({ ...customer, contactPerson: v })} />
            <Field label="Phone" value={customer.phone || ""} disabled={!isEditing} onChange={(v) => setCustomer({ ...customer, phone: v })} icon={<Phone className="absolute left-3 top-3 h-4 w-4 text-pink-400" />} />
            <Field label="Email" value={customer.email || ""} disabled={!isEditing} onChange={(v) => setCustomer({ ...customer, email: v })} icon={<Mail className="absolute left-3 top-3 h-4 w-4 text-pink-400" />} />
          </div>
          <div className="space-y-4">
            <TextField label="Address" value={customer.address || ""} disabled={!isEditing} onChange={(v) => setCustomer({ ...customer, address: v })} icon={<MapPin className="absolute left-3 top-3 h-4 w-4 text-pink-400" />} />
            <div className="grid gap-2">
              <Label className="text-gray-700 font-medium">Status</Label>
              <Badge variant={customer.status === "active" ? "default" : "secondary"}>{customer.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Order History tetap dummy */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Order History</h2>
        <DataTable columns={orderColumns} data={mockOrders} searchPlaceholder="Search orders..." />
      </div>
    </div>
  )
}

function Field({ label, value, onChange, disabled, icon }: any) {
  return (
    <div className="grid gap-2">
      <Label className="text-gray-700 font-medium">{label}</Label>
      <div className="relative">
        {icon}
        <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`gradient-input ${icon ? "pl-10" : ""}`} />
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, disabled, icon }: any) {
  return (
    <div className="grid gap-2">
      <Label className="text-gray-700 font-medium">{label}</Label>
      <div className="relative">
        {icon}
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} rows={3} className={`gradient-input resize-none ${icon ? "pl-10" : ""}`} />
      </div>
    </div>
  )
}
