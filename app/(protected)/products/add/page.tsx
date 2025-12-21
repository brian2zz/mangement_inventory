"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal";
import { apiFetch } from "@/lib/api";

/* ======================================================
   TYPES
====================================================== */
interface Category {
  id: number;
  categoryName: string;
}

interface Supplier {
  id: number;
  name: string;
}

/* ======================================================
   PAGE
====================================================== */
export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false);

  const [form, setForm] = React.useState({
    cardNumber: "",
    productName: "",
    partNumber: "",
    description: "",
    categoryId: "",
    supplierId: null as number | null,
    supplierName: "",
    unitPrice: "",
    reorderLevel: "",
    initialStock: "",
  });

  /* ======================================================
     FETCH CATEGORIES
  ====================================================== */
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch("/categories?limit=100");
        const json = await res.json();
        if (json.success) setCategories(json.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, []);

  /* ======================================================
     VALIDATION
  ====================================================== */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.productName) e.productName = "Product name is required";
    if (!form.categoryId) e.category = "Category is required";
    if (!form.unitPrice || Number(form.unitPrice) <= 0)
      e.unitPrice = "Unit price must be > 0";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ======================================================
     SAVE
  ====================================================== */
  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      // 1️⃣ CREATE PRODUCT
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          cardNumber: form.cardNumber || null,
          productName: form.productName,
          partNumber: form.partNumber || null,
          description: form.description || null,
          categoryId: Number(form.categoryId),
          supplierId: form.supplierId,
          unitPrice: Number(form.unitPrice),
          reorderLevel: Number(form.reorderLevel) || 0,
          status: "active",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create product");
      }

      const productId = json.product.id;

      // 2️⃣ INITIAL STOCK → STOCK ADJUSTMENT
      if (Number(form.initialStock) > 0) {
        await apiFetch(`/products/${productId}/adjust-stock`, {
          method: "POST",
          body: JSON.stringify({
            quantity: Number(form.initialStock),
            notes: "Initial stock",
          }),
        });
      }

      alert("Product added successfully");
      router.push("/products");
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    } finally {
      setIsLoading(false);
    }
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add Product
          </h1>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="btn-gradient">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* FORM */}
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* LEFT */}
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input
                  value={form.cardNumber}
                  onChange={(e) =>
                    setForm({ ...form, cardNumber: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Product Name *</Label>
                <Input
                  value={form.productName}
                  onChange={(e) =>
                    setForm({ ...form, productName: e.target.value })
                  }
                  className={errors.productName ? "border-red-500" : ""}
                />
              </div>

              <div>
                <Label>Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) =>
                    setForm({ ...form, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>

              <div>
                <Label>Part Number</Label>
                <Input
                  value={form.partNumber}
                  onChange={(e) =>
                    setForm({ ...form, partNumber: e.target.value })
                  }
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <div>
                <Label>Supplier</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.supplierName}
                    readOnly
                    placeholder="Select supplier"
                  />
                  <Button onClick={() => setOpenSupplierModal(true)}>
                    Select
                  </Button>
                </div>
              </div>

              <div>
                <Label>Unit Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                  className={errors.unitPrice ? "border-red-500" : ""}
                />
              </div>

              <div>
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  value={form.reorderLevel}
                  onChange={(e) =>
                    setForm({ ...form, reorderLevel: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Initial Stock</Label>
                <Input
                  type="number"
                  value={form.initialStock}
                  onChange={(e) =>
                    setForm({ ...form, initialStock: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* SUPPLIER MODAL */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={(s: Supplier) =>
          setForm((f) => ({
            ...f,
            supplierId: s.id,
            supplierName: s.name,
          }))
        }
      />
    </div>
  );
}
