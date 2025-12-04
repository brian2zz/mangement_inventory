"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Selector modals (assume these components exist like in incoming)
import CustomerSelectModal from "@/components/selectors/CustomerSelectModal";
import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";

interface ProductItem {
  id: string;
  productId: number | null;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  stock?: number; // current stock snapshot
  notes?: string;
}

export default function AddOutgoingProductPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Header data: date, customer, warehouse, notes, status
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split("T")[0],
    customerId: null as number | null,
    customerName: "",
    warehouseId: null as number | null,
    warehouseName: "",
    notes: "",
    submitStatus: "Draft" as "Draft" | "Done",
  });

  // Dynamic items
  const [items, setItems] = React.useState<ProductItem[]>([
    { id: Date.now().toString(), productId: null, productName: null, partNumber: null, quantity: 0, unitPrice: 0, stock: 0, notes: "" },
  ]);

  // Modals
  const [openCustomerModal, setOpenCustomerModal] = React.useState(false);
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  // ======= Select callbacks =======
  const handleCustomerSelect = (c: { id: number; name: string }) => {
    setFormData((p) => ({ ...p, customerId: c.id, customerName: c.name }));
    setOpenCustomerModal(false);
  };

  const handleWarehouseSelect = (w: { id: number; name: string }) => {
    setFormData((p) => ({ ...p, warehouseId: w.id, warehouseName: w.name }));
    setOpenWarehouseModal(false);
  };

  const handleProductSelect = (p: { id: number; productName: string; partNumber?: string | null; unitPrice?: number; stock?: number }) => {
    if (!activeItemId) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItemId
          ? {
            ...it,
            productId: p.id,
            productName: p.productName,
            partNumber: p.partNumber ?? null,
            unitPrice: p.unitPrice ?? 0,
            stock: p.stock ?? 0,
          }
          : it
      )
    );
    setActiveItemId(null);
    setOpenProductModal(false);
  };

  // ======= Items manipulation =======
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), productId: null, productName: null, partNumber: null, quantity: 0, unitPrice: 0, stock: 0, notes: "" },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItemField = <K extends keyof ProductItem>(id: string, field: K, value: ProductItem[K]) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  // ======= Validation & totals =======
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.customerId) newErrors.customer = "Customer is required";
    if (!formData.warehouseId) newErrors.warehouse = "Warehouse is required";

    items.forEach((item, idx) => {
      if (!item.productId) newErrors[`item_${idx}_product`] = "Product is required";
      if (!item.quantity || item.quantity <= 0) newErrors[`item_${idx}_quantity`] = "Quantity must be > 0";

      if (formData.submitStatus === "Done" && item.stock !== undefined && item.quantity > (item.stock ?? 0)) {
        newErrors[`item_${idx}_quantity`] = `Insufficient stock. Available: ${item.stock ?? 0}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const totalItems = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const totalValue = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
    return { totalItems, totalValue };
  };

  // ======= Save handler =======
  const handleSave = async (status: "Draft" | "Done") => {
    setFormData((p) => ({ ...p, submitStatus: status }));
    if (!validateForm()) {
      alert("Please fix the validation errors before saving.");
      return;
    }

    setIsLoading(true);

    const payload = {
      customerId: Number(formData.customerId),
      warehouseId: Number(formData.warehouseId),
      transactionDate: formData.date,
      notes: formData.notes,
      status,
      items: items
        .filter((it) => it.productId)
        .map((it) => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice || 0),
          notes: it.notes || null,
        })),
      totalItems: calculateTotals().totalItems,
      totalValue: calculateTotals().totalValue,
      // optionally include createdById if available in client
    };

    try {
      const res = await fetch("/api/outgoing-transactions", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        console.error("Save failed", json);
        alert(`Failed to save: ${json.error || res.statusText}`);
        return;
      }

      alert("Outgoing transaction saved successfully.");
      router.push("/outgoing");
    } catch (err) {
      console.error("Save error", err);
      alert("Unexpected error while saving outgoing transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  const { totalItems, totalValue } = calculateTotals();

  // ======= Render =======
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add Outgoing Product
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handleSave("Draft")} disabled={isLoading}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSave("Done")} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-pink-600">{totalItems}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-red-600">${totalValue.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge variant={formData.submitStatus === "Done" ? "default" : "secondary"} className="mt-1">
            {formData.submitStatus}
          </Badge>
        </div>
      </div>

      {/* Transaction Info */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Transaction Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                className={errors.date ? "border-red-500" : ""}
              />
            </div>

            <div className="grid gap-2">
              <Label>Customer *</Label>
              <div className="flex items-center gap-2">
                <Input value={formData.customerName} readOnly placeholder="Select customer" />
                <Button onClick={() => setOpenCustomerModal(true)}>Select Customer</Button>
              </div>
              {errors.customer && <p className="text-red-500 text-sm">{errors.customer}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Warehouse *</Label>
              <div className="flex items-center gap-2">
                <Input value={formData.warehouseName} readOnly placeholder="Select warehouse" />
                <Button onClick={() => setOpenWarehouseModal(true)}>Select Warehouse</Button>
              </div>
              {errors.warehouse && <p className="text-red-500 text-sm">{errors.warehouse}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Products</CardTitle>
            <Button onClick={addItem} variant="outline" size="sm" className="btn-gradient border-0 bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="p-4 border border-pink-200 rounded-lg bg-white/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Product {idx + 1}</h4>
                {items.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Product select */}
                <div className="grid gap-2">
                  <Label>Product *</Label>
                  <div className="flex items-center gap-2">
                    <Input value={item.productName ?? ""} readOnly placeholder="Select product" className={errors[`item_${idx}_product`] ? "border-red-500" : ""} />
                    <Button
                      onClick={() => {
                        setActiveItemId(item.id);
                        setOpenProductModal(true);
                      }}
                    >
                      Select
                    </Button>
                  </div>
                  {errors[`item_${idx}_product`] && <p className="text-red-500 text-sm">{errors[`item_${idx}_product`]}</p>}
                </div>

                {/* part number */}
                <div className="grid gap-2">
                  <Label>Part Number</Label>
                  <Input value={item.partNumber ?? ""} readOnly />
                </div>

                {/* quantity */}
                <div className="grid gap-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={item.quantity || ""}
                    onChange={(e) => updateItemField(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                    className={errors[`item_${idx}_quantity`] ? "border-red-500" : ""}
                    min={1}
                    max={item.stock ?? undefined}
                  />
                  {item.stock !== undefined && <p className="text-xs text-gray-500">Available: {item.stock}</p>}
                  {errors[`item_${idx}_quantity`] && <p className="text-red-500 text-sm">{errors[`item_${idx}_quantity`]}</p>}
                </div>

                {/* unit price */}
                <div className="grid gap-2">
                  <Label>Unit Price</Label>
                  <Input type="number" step="0.01" value={item.unitPrice || ""} onChange={(e) => updateItemField(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)} />
                </div>

                {/* notes per item */}
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={item.notes || ""} onChange={(e) => updateItemField(item.id, "notes", e.target.value)} />
                </div>
              </div>

              {/* subtotal */}
              <div className="flex justify-end">
                <div className="text-sm text-gray-600">
                  Subtotal: <span className="font-medium text-red-600">${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* bottom actions */}
      <div className="flex items-center justify-end space-x-4 pb-6">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button variant="outline" onClick={() => handleSave("Draft")}>Save as Draft</Button>
        <Button onClick={() => handleSave("Done")} className="btn-gradient border-0">
          <Save className="mr-2 h-4 w-4" />
          Submit Transaction
        </Button>
      </div>

      {/* Modals */}
      <CustomerSelectModal open={openCustomerModal} onClose={() => setOpenCustomerModal(false)} onSelect={handleCustomerSelect} />
      <WarehouseSelectModal open={openWarehouseModal} onClose={() => setOpenWarehouseModal(false)} onSelect={handleWarehouseSelect} />
      <ProductSelectModal open={openProductModal} onClose={() => setOpenProductModal(false)} onSelect={handleProductSelect} />
    </div>
  );
}
