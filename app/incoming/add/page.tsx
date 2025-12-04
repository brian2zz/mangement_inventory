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

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";
import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";

interface Supplier {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface ProductRow {
  id: number;
  productName: string;
  partNumber?: string | null;
  unitPrice?: number;
  stock?: number;
}

interface ProductItem {
  id: string;
  productId: number | null;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  stock?: number;
  notes?: string;
}

// ==========================================================
// PAGE COMPONENT
// ==========================================================
export default function AddIncomingProductPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form header
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split("T")[0],
    supplierId: null as number | null,
    supplierName: "",
    warehouseId: null as number | null,
    warehouseName: "",
    notes: "",
    submitStatus: "Draft" as "Draft" | "Done",
  });


  // Items (dynamic)
  const [items, setItems] = React.useState<ProductItem[]>([
    { id: Date.now().toString(), productId: null, productName: null, partNumber: null, quantity: 0, unitPrice: 0, stock: 0, notes: "" },
  ]);

  // Modals
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  // ==========================================================
  // SELECTORS CALLBACKS
  // ==========================================================
  const handleSupplierSelect = (s: Supplier) => {
    setFormData((prev) => ({ ...prev, supplierId: s.id, supplierName: s.name }));
  };

  const handleProductSelect = (p: ProductRow) => {
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
  };

  // ==========================================================
  // ITEMS LOGIC
  // ==========================================================
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), productId: null, productName: null, partNumber: null, quantity: 0, unitPrice: 0, stock: 0, notes: "" },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItemField = <K extends keyof ProductItem>(id: string, field: K, value: ProductItem[K]) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.supplierId) newErrors.supplier = "Supplier is required";
    if (!formData.warehouseId) newErrors.warehouse = "Warehouse is required";
    items.forEach((item, idx) => {
      if (!item.productId) newErrors[`item_${idx}_product`] = "Product is required";
      if (!item.quantity || item.quantity <= 0) newErrors[`item_${idx}_quantity`] = "Quantity must be > 0";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);
    const totalValue = items.reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0);
    return { totalItems, totalValue };
  };

  // ==========================================================
  // SAVE HANDLER → CALL BACKEND
  // ==========================================================
  const handleSave = async (status: "Draft" | "Done") => {
    if (!validateForm()) {
      alert("Please fix validation errors.");
      return;
    }

    setIsLoading(true);

    const payload = {
      supplierId: Number(formData.supplierId),
      warehouseId: Number(formData.warehouseId), // adapt if warehouse selection added
      transactionDate: formData.date,
      notes: formData.notes,
      status,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        notes: it.notes,
      })),
    };

    try {
      const res = await fetch("/api/incoming-transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Save failed");

      alert("Transaction saved");
      router.push("/incoming");
    } catch (err) {
      console.error(err);
      alert("Failed to save incoming transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  const { totalItems, totalValue } = calculateTotals();

  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add Incoming Product
          </h1>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleSave("Draft")} disabled={isLoading}>
            Save as Draft
          </Button>
          <Button className="btn-gradient" onClick={() => handleSave("Done")} disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="enhanced-card p-4">
          <div>Total Items</div>
          <div className="text-2xl font-bold">{totalItems}</div>
        </div>
        <div className="enhanced-card p-4">
          <div>Total Value</div>
          <div className="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</div>
        </div>
        <div className="enhanced-card p-4">
          <div>Status</div>
          <Badge>{formData.submitStatus}</Badge>
        </div>
      </div>

      {/* TRANSACTION INFO */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Transaction Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* DATE */}
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((s) => ({ ...s, date: e.target.value }))}
                className={errors.date ? "border-red-500" : ""}
              />
            </div>

            {/* SUPPLIER */}
            <div className="grid gap-2">
              <Label>Supplier *</Label>
              <div className="flex items-center gap-2">
                <Input value={formData.supplierName} readOnly placeholder="Select supplier" />
                <Button
                  onClick={() => {
                    setOpenSupplierModal(true);
                  }}
                >
                  Select Supplier
                </Button>
              </div>
              {errors.supplier && <p className="text-red-500 text-sm">{errors.supplier}</p>}
            </div>
            {/* WAREHOUSE */}
            <div className="grid gap-2">
              <Label>Warehouse *</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.warehouseName || ""}
                  readOnly
                  placeholder="Select warehouse"
                />
                <Button
                  onClick={() => {
                    setOpenWarehouseModal(true);
                  }}
                >
                  Select
                </Button>
              </div>
              {errors.warehouse && (
                <p className="text-red-500 text-sm">{errors.warehouse}</p>
              )}
            </div>
          </div>

          {/* NOTES */}
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea value={formData.notes} onChange={(e) => setFormData((s) => ({ ...s, notes: e.target.value }))} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* PRODUCTS */}
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle>Products</CardTitle>
            <Button onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, idx) => (
            <div key={item.id} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between">
                <h4>Item {idx + 1}</h4>
                {items.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* PRODUCT SELECT */}
                <div className="grid gap-2">
                  <Label>Product *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.productName ?? ""}
                      placeholder="Select product"
                      readOnly
                      className={errors[`item_${idx}_product`] ? "border-red-500" : ""}
                    />
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

                {/* PART NUMBER (display only) */}
                <div className="grid gap-2">
                  <Label>Part Number</Label>
                  <Input value={item.partNumber ?? ""} readOnly placeholder="Auto" />
                </div>

                {/* QUANTITY */}
                <div className="grid gap-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItemField(item.id, "quantity", Number(e.target.value))}
                    className={errors[`item_${idx}_quantity`] ? "border-red-500" : ""}
                  />
                </div>

                {/* UNIT PRICE */}
                <div className="grid gap-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItemField(item.id, "unitPrice", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* NOTES */}
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={item.notes} onChange={(e) => updateItemField(item.id, "notes", e.target.value)} />
              </div>

              {/* Subtotal */}
              <div className="flex justify-end">
                <div className="text-sm text-gray-600">
                  Subtotal:{" "}
                  <span className="font-medium text-green-600">
                    ${(item.quantity * (item.unitPrice || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hidden Modals */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={handleSupplierSelect}
      />

      <WarehouseSelectModal
        open={openWarehouseModal}
        onClose={() => setOpenWarehouseModal(false)}
        onSelect={(w) => {
          setFormData((prev) => ({
            ...prev,
            warehouseId: w.id,
            warehouseName: w.name,
          }));
        }}
      />

      <ProductSelectModal open={openProductModal} onClose={() => setOpenProductModal(false)} onSelect={handleProductSelect} />
    </div>
  );
}
