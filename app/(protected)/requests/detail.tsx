"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Edit, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { apiFetch } from "@/lib/api"
import { formatRupiah } from "@/lib/utils"

/* ================= TYPES ================= */
type Status = "Pending" | "Partial" | "Fulfilled"

interface ApiItem {
  id: number // ✅ TAMBAH
  productName: string
  requestedQuantity: number
  fulfilledQuantity: number
  unitPrice: number
  totalPrice: number
}

interface ApiDetail {
  id: number
  requestDate: string
  fulfilledDate: string | null
  store: string
  supplier: string | null
  notes: string | null
  status: Status
  items: ApiItem[]
}

interface Item {
  id: number
  product_name: string
  requested_quantity: number
  fulfilled_quantity: number
  unit_price: number
}

interface RequestDetail {
  id: string
  requestDate: string
  fulfilledDate: string | null
  store: string
  supplier: string | null
  notes: string | null
  status: Status
  items: Item[]
}

/* ================= PAGE ================= */
export default function ProductRequestDetailPage({ id }: { id: string }) {
  const router = useRouter()

  const [loading, setLoading] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [request, setRequest] = React.useState<RequestDetail | null>(null)

  /* ================= LOAD ================= */
  React.useEffect(() => {
    loadDetail()
  }, [])

  const loadDetail = async () => {
    try {
      const res = await apiFetch(`/product-requests/${id}`, { method: "GET" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const d: ApiDetail = json.data

      // 🔥 MAP RESPONSE → INTERNAL STATE
      setRequest({
        id: String(d.id),
        requestDate: d.requestDate,
        fulfilledDate: d.fulfilledDate,
        store: d.store,
        supplier: d.supplier,
        notes: d.notes,
        status: d.status,
        items: d.items.map((i) => ({
          id: i.id, // ✅ ID ASLI DATABASE
          product_name: i.productName,
          requested_quantity: i.requestedQuantity,
          fulfilled_quantity: i.fulfilledQuantity,
          unit_price: i.unitPrice,
        })),
      })
    } catch (e) {
      console.error(e)
      alert("Failed to load request")
    }
  }

  if (!request) return null

  /* ================= TOTALS ================= */
  const totalRequestedQty = request.items.reduce(
    (s, i) => s + i.requested_quantity,
    0
  )

  const totalFulfilledQty = request.items.reduce(
    (s, i) => s + i.fulfilled_quantity,
    0
  )

  const totalPrice = request.items.reduce(
    (s, i) => s + i.fulfilled_quantity * i.unit_price,
    0
  )

  const computedStatus: Status =
    totalFulfilledQty === 0
      ? "Pending"
      : totalFulfilledQty < totalRequestedQty
        ? "Partial"
        : "Fulfilled"

  /* ================= UPDATE ITEM ================= */
  const updateItem = (
    itemId: number,
    field: keyof Item,
    value: number | string
  ) => {
    setRequest((prev) =>
      prev
        ? {
          ...prev,
          items: prev.items.map((i) =>
            i.id === itemId ? { ...i, [field]: value } : i
          ),
        }
        : prev
    )
  }

  /* ================= SAVE ================= */
  const handleSave = async () => {
    setLoading(true)

    try {
      const payload = {
        requestDate: request.requestDate,
        fulfilledDate: request.fulfilledDate,
        store: request.store,
        supplier: request.supplier,
        notes: request.notes,
        status: computedStatus,
        items: request.items.map((i) => ({
          id: i.id, // ✅ WAJIB
          product_name: i.product_name,
          requested_quantity: i.requested_quantity,
          fulfilled_quantity: i.fulfilled_quantity,
          unit_price: i.unit_price,
          total_price: i.fulfilled_quantity * i.unit_price,
        })),
      }

      const res = await apiFetch(`/product-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      alert("Request updated successfully")
      setEditing(false)
      loadDetail()
    } catch (e) {
      console.error(e)
      alert("Failed to update request")
    } finally {
      setLoading(false)
    }
  }

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    try {
      await apiFetch(`/product-requests/${id}`, { method: "DELETE" })
      router.push("/requests")
    } catch {
      alert("Failed to delete request")
    }
  }

  /* ================= FULFILL ================= */
  const handleFulfill = () => {
    setRequest((prev) =>
      prev
        ? {
          ...prev,
          fulfilledDate: new Date().toISOString().split("T")[0],
          items: prev.items.map((i) => ({
            ...i,
            fulfilled_quantity: i.requested_quantity,
          })),
        }
        : prev
    )
    setEditing(true)
  }

  const badgeVariant =
    computedStatus === "Fulfilled"
      ? "default"
      : computedStatus === "Partial"
        ? "secondary"
        : "destructive"

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Product Request Detail
          </h1>
        </div>

        <div className="flex gap-2">
          {computedStatus !== "Fulfilled" && (
            <Button onClick={handleFulfill} className="bg-green-600 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              Fulfill All
            </Button>
          )}

          {!editing ? (
            <Button onClick={() => setEditing(true)} className="btn-gradient">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading} className="btn-gradient">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm">Total Requested Qty</div>
          <div className="text-2xl font-bold">{totalRequestedQty}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm">Total Fulfilled Qty</div>
          <div className="text-2xl font-bold text-green-600">{totalFulfilledQty}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm">Total Price</div>
          <div className="text-2xl font-bold">{formatRupiah(totalPrice)}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm">Status</div>
          <Badge variant={badgeVariant}>{computedStatus}</Badge>
        </div>
      </div>

      {/* REQUEST INFO */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Request Date</Label>
              <Input
                type="date"
                value={request.requestDate}
                onChange={(e) =>
                  setRequest({ ...request, requestDate: e.target.value })
                }
                disabled={!editing}
              />
            </div>

            <div>
              <Label>Fulfilled Date</Label>
              <Input
                type="date"
                value={request.fulfilledDate ?? ""}
                onChange={(e) =>
                  setRequest({ ...request, fulfilledDate: e.target.value })
                }
                disabled={!editing}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Store</Label>
              <Input
                value={request.store}
                onChange={(e) =>
                  setRequest({ ...request, store: e.target.value })
                }
                disabled={!editing}
              />
            </div>

            <div>
              <Label>Supplier</Label>
              <Input
                value={request.supplier ?? ""}
                onChange={(e) =>
                  setRequest({ ...request, supplier: e.target.value })
                }
                disabled={!editing}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={request.notes ?? ""}
              onChange={(e) =>
                setRequest({ ...request, notes: e.target.value })
              }
              disabled={!editing}
            />
          </div>
        </CardContent>
      </Card>

      {/* ITEMS */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {request.items.map((item, idx) => (
            <div key={item.id} className="border p-4 rounded-lg space-y-4">
              <h4 className="font-medium">Item {idx + 1}</h4>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label>Product</Label>
                  <Input value={item.product_name} disabled />
                </div>

                <div>
                  <Label>Requested Qty</Label>
                  <Input type="number" value={item.requested_quantity} disabled />
                </div>

                <div>
                  <Label>Fulfilled Qty</Label>
                  <Input
                    type="number"
                    value={item.fulfilled_quantity}
                    onChange={(e) =>
                      updateItem(item.id, "fulfilled_quantity", Number(e.target.value))
                    }
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(item.id, "unit_price", Number(e.target.value))
                    }
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="text-right text-sm">
                Subtotal:{" "}
                <span className="font-medium">
                  {formatRupiah(item.fulfilled_quantity * item.unit_price)}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
