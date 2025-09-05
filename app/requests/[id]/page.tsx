"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Edit, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  const [request, setRequest] = React.useState({
    id: params.id as string,
    requestedItem: "Widget A",
    requestedQuantity: 50,
    fulfilledQuantity: 50,
    requestDate: "2024-01-10",
    fulfilledDate: "2024-01-15",
    store: "Store A",
    unitPrice: 25.99,
    totalPrice: 1299.5,
    status: "Fulfilled" as "Pending" | "Partial" | "Fulfilled",
    notes: "Completed on time with full quantity",
    priority: "Normal" as "Low" | "Normal" | "High" | "Urgent",
    requestedBy: "John Doe",
    approvedBy: "Jane Smith",
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Mock save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    setIsEditing(false)
    alert("Product request updated successfully!")
  }

  const handleDelete = async () => {
    setIsLoading(true)
    // Mock delete operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    router.push("/requests")
  }

  const handleFulfill = async () => {
    setIsLoading(true)
    // Mock fulfill operation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setRequest({
      ...request,
      status: "Fulfilled",
      fulfilledQuantity: request.requestedQuantity,
      fulfilledDate: new Date().toISOString().split("T")[0],
    })
    setIsLoading(false)
    alert("Request fulfilled successfully!")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Fulfilled":
        return "default"
      case "Partial":
        return "secondary"
      case "Pending":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "destructive"
      case "High":
        return "secondary"
      case "Normal":
        return "default"
      case "Low":
        return "outline"
      default:
        return "default"
    }
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
            Product Request Details
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {request.status === "Pending" && (
            <Button onClick={handleFulfill} disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Fulfilled
            </Button>
          )}
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
                  This action cannot be undone. This will permanently delete the product request and remove all
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
      <div className="grid gap-4 md:grid-cols-5">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Requested Qty</div>
          <div className="text-2xl font-bold text-blue-600">{request.requestedQuantity}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Fulfilled Qty</div>
          <div className="text-2xl font-bold text-green-600">{request.fulfilledQuantity}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Price</div>
          <div className="text-2xl font-bold text-purple-600">${request.totalPrice.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge variant={getStatusColor(request.status)} className="mt-1">
            {request.status}
          </Badge>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Priority</div>
          <Badge variant={getPriorityColor(request.priority)} className="mt-1">
            {request.priority}
          </Badge>
        </div>
      </div>

      {/* Request Details */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Request Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="requestedItem" className="text-gray-700 font-medium">
                Requested Item
              </Label>
              <Input
                id="requestedItem"
                value={request.requestedItem}
                onChange={(e) => setRequest({ ...request, requestedItem: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requestedQuantity" className="text-gray-700 font-medium">
                Requested Quantity
              </Label>
              <Input
                id="requestedQuantity"
                type="number"
                value={request.requestedQuantity}
                onChange={(e) => setRequest({ ...request, requestedQuantity: Number.parseInt(e.target.value) || 0 })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fulfilledQuantity" className="text-gray-700 font-medium">
                Fulfilled Quantity
              </Label>
              <Input
                id="fulfilledQuantity"
                type="number"
                value={request.fulfilledQuantity}
                onChange={(e) => setRequest({ ...request, fulfilledQuantity: Number.parseInt(e.target.value) || 0 })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requestDate" className="text-gray-700 font-medium">
                Request Date
              </Label>
              <Input
                id="requestDate"
                type="date"
                value={request.requestDate}
                onChange={(e) => setRequest({ ...request, requestDate: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fulfilledDate" className="text-gray-700 font-medium">
                Fulfilled Date
              </Label>
              <Input
                id="fulfilledDate"
                type="date"
                value={request.fulfilledDate}
                onChange={(e) => setRequest({ ...request, fulfilledDate: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="store" className="text-gray-700 font-medium">
                Store
              </Label>
              <Input
                id="store"
                value={request.store}
                onChange={(e) => setRequest({ ...request, store: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
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
                value={request.unitPrice}
                onChange={(e) => setRequest({ ...request, unitPrice: Number.parseFloat(e.target.value) || 0 })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority" className="text-gray-700 font-medium">
                Priority
              </Label>
              {isEditing ? (
                <Select
                  value={request.priority}
                  onValueChange={(value: "Low" | "Normal" | "High" | "Urgent") =>
                    setRequest({ ...request, priority: value })
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
              ) : (
                <div className="p-2">
                  <Badge variant={getPriorityColor(request.priority)}>{request.priority}</Badge>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requestedBy" className="text-gray-700 font-medium">
                Requested By
              </Label>
              <Input
                id="requestedBy"
                value={request.requestedBy}
                onChange={(e) => setRequest({ ...request, requestedBy: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="approvedBy" className="text-gray-700 font-medium">
                Approved By
              </Label>
              <Input
                id="approvedBy"
                value={request.approvedBy}
                onChange={(e) => setRequest({ ...request, approvedBy: e.target.value })}
                className="gradient-input"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
        <div className="grid gap-2 mt-6">
          <Label htmlFor="notes" className="text-gray-700 font-medium">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={request.notes}
            onChange={(e) => setRequest({ ...request, notes: e.target.value })}
            rows={3}
            className="gradient-input resize-none"
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  )
}
