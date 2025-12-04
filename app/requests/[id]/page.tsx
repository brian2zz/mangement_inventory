"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Edit, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export default function ProductRequestDetailPage() {
  const params = useParams()
  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)

  // ==============================
  // STATE (MATCH FORM BARU)
  // ==============================
  const [request, setRequest] = React.useState({
    id: params.id as string,
    requestedItem: "",
    notes: "",
    requestedQuantity: 0,
    fulfilledQuantity: 0,
    requestDate: "",
    fulfilledDate: "",
    store: "",
    supplier: "",
    unitPrice: 0,
    totalPrice: 0,
    status: "Pending" as "Pending" | "Partial" | "Fulfilled",
  })

  // ==============================
  // LOAD DATA (REAL API INTEGRATION READY)
  // ==============================
  React.useEffect(() => {
    loadDetail()
  }, [])

  const loadDetail = async () => {
    try {
      const res = await fetch(`/api/product-requests/${params.id}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setRequest(json.data)
    } catch (e) {
      console.error(e)
      alert("Failed to load request.")
    }
  }

  // AUTO CALC TOTAL + STATUS
  const totalPrice = request.requestedQuantity * request.unitPrice

  const computeStatus = () => {
    if (request.fulfilledQuantity === 0) return "Pending"
    if (request.fulfilledQuantity < request.requestedQuantity) return "Partial"
    return "Fulfilled"
  }

  // ==============================
  // SAVE UPDATE
  // ==============================
  const handleSave = async () => {
    setIsLoading(true)

    const payload = {
      ...request,
      totalPrice,
      status: computeStatus(),
    }

    try {
      const res = await fetch(`/api/product-requests/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      alert("Request updated successfully!")
      setIsEditing(false)
    } catch (e) {
      console.error(e)
      alert("Failed to update request.")
    } finally {
      setIsLoading(false)
    }
  }

  // ==============================
  // DELETE
  // ==============================
  const handleDelete = async () => {
    try {
      await fetch(`/api/product-requests/${params.id}`, { method: "DELETE" })
      router.push("/requests")
    } catch {
      alert("Failed to delete request.")
    }
  }

  // ==============================
  // FULFILL ACTION
  // ==============================
  const handleFulfill = async () => {
    setIsLoading(true)

    const payload = {
      ...request,
      fulfilledQuantity: request.requestedQuantity,
      fulfilledDate: new Date().toISOString().split("T")[0],
      status: "Fulfilled",
      totalPrice,
    }

    try {
      const res = await fetch(`/api/product-requests/${params.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setRequest({
        ...payload,
        status: payload.status as "Pending" | "Partial" | "Fulfilled"
      });
      alert("Marked as Fulfilled!")
    } catch (e) {
      console.error(e)
      alert("Failed to update status.")
    } finally {
      setIsLoading(false)
    }
  }

  const statusColor = {
    Pending: "destructive",
    Partial: "secondary",
    Fulfilled: "default",
  }[request.status]

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>

          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Product Request Details
          </h1>
        </div>

        <div className="flex gap-2">
          {request.status !== "Fulfilled" && (
            <Button onClick={handleFulfill} disabled={isLoading} className="bg-green-600 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Fulfilled
            </Button>
          )}

          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="btn-gradient">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading} className="btn-gradient">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}

          {/* DELETE */}
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

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm">Requested Quantity</div>
          <div className="text-2xl font-bold">{request.requestedQuantity}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm">Fulfilled Quantity</div>
          <div className="text-2xl font-bold text-green-600">{request.fulfilledQuantity}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm">Total Price</div>
          <div className="text-2xl font-bold">${totalPrice.toFixed(2)}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm">Status</div>
          <Badge variant={statusColor as "default" | "destructive" | "outline" | "secondary"}>
            {request.status}
          </Badge>
        </div>
      </div>

      {/* FORM FIELDS */}
      <div className="enhanced-card p-6 space-y-6">
        <h2 className="text-xl font-semibold">Request Information</h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="space-y-4">

            <div className="grid gap-2">
              <Label>Requested Item</Label>
              <Input
                value={request.requestedItem}
                onChange={(e) => setRequest({ ...request, requestedItem: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input
                value={request.notes}
                onChange={(e) => setRequest({ ...request, notes: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Requested Quantity</Label>
              <Input
                type="number"
                value={request.requestedQuantity}
                onChange={(e) =>
                  setRequest({ ...request, requestedQuantity: Number(e.target.value) })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Fulfilled Quantity</Label>
              <Input
                type="number"
                value={request.fulfilledQuantity}
                onChange={(e) =>
                  setRequest({ ...request, fulfilledQuantity: Number(e.target.value) })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Request Date</Label>
              <Input
                type="date"
                value={request.requestDate}
                onChange={(e) => setRequest({ ...request, requestDate: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Fulfilled Date</Label>
              <Input
                type="date"
                value={request.fulfilledDate}
                onChange={(e) => setRequest({ ...request, fulfilledDate: e.target.value })}
                disabled={!isEditing}
              />
            </div>

          </div>

          <div className="space-y-4">

            <div className="grid gap-2">
              <Label>Store</Label>
              <Input
                value={request.store}
                onChange={(e) => setRequest({ ...request, store: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Supplier</Label>
              <Input
                value={request.supplier}
                onChange={(e) => setRequest({ ...request, supplier: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                value={request.unitPrice}
                onChange={(e) =>
                  setRequest({ ...request, unitPrice: Number(e.target.value) })
                }
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-2">
              <Label>Total Price</Label>
              <Input value={totalPrice.toFixed(2)} readOnly className="bg-gray-100" />
            </div>

          </div>
        </div>

        {/* NOTES BOTTOM */}
        <div className="grid gap-2 mt-4">
          <Label>Notes</Label>
          <Textarea
            rows={3}
            value={request.notes}
            onChange={(e) => setRequest({ ...request, notes: e.target.value })}
            disabled={!isEditing}
          />
        </div>

      </div>
    </div>
  )
}
