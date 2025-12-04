"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AddCustomerPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState({
    customerName: "",
    phoneNumber: "",
    address: "",
    email: "",
    contactPerson: "",
    companyType: "",
    notes: "",
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required"
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add customer");
        return;
      }

      alert("Customer added successfully!");
      router.push("/customers");
    } catch (error) {
      console.error(error);
      alert("Failed to add customer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
            Add New Customer
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
            {isLoading ? "Saving..." : "Save Customer"}
          </Button>
        </div>
      </div>

      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="text-xl text-gray-800">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName" className="text-gray-700 font-medium form-label-accent">
                  Customer Name *
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  className={`gradient-input ${errors.customerName ? "border-red-500" : ""}`}
                />
                {errors.customerName && <p className="text-red-500 text-sm">{errors.customerName}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber" className="text-gray-700 font-medium form-label-accent">
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Enter phone number"
                  className={`gradient-input ${errors.phoneNumber ? "border-red-500" : ""}`}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  className={`gradient-input ${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactPerson" className="text-gray-700 font-medium">
                  Contact Person
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="gradient-input"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-gray-700 font-medium form-label-accent">
                  Address *
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter customer address"
                  rows={3}
                  className={`gradient-input resize-none ${errors.address ? "border-red-500" : ""}`}
                />
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="companyType" className="text-gray-700 font-medium">
                  Company Type
                </Label>
                <Input
                  id="companyType"
                  value={formData.companyType}
                  onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                  placeholder="e.g., Manufacturing, Retail, etc."
                  className="gradient-input"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-gray-700 font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes"
                  rows={2}
                  className="gradient-input resize-none"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
