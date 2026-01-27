"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ProductSelectModal from "@/components/selectors/ProductSelectModal";

type Mode = "add" | "edit";

interface InventoryAdjustmentModalProps {
  open: boolean;
  mode: Mode;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryAdjustmentModal({
  open,
  mode,
  initialData,
  onClose,
  onSuccess,
}: InventoryAdjustmentModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [openProductModal, setOpenProductModal] = React.useState(false);

  const [form, setForm] = React.useState({
    productId: null as number | null,
    productName: "",
    adjustmentType: "Increase" as "Increase" | "Decrease",
    quantity: 0,
    notes: "",
  });

  // =========================
  // LOAD EDIT DATA
  // =========================
  React.useEffect(() => {
    if (mode === "edit" && initialData) {
      setForm({
        productId: initialData.productId,
        productName: initialData.productName,
        adjustmentType: initialData.adjustmentType,
        quantity: initialData.quantity,
        notes: initialData.notes ?? "",
      });
    }
  }, [mode, initialData]);

  // =========================
  // VALIDATION
  // =========================
  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.productId) e.product = "Product required";
    if (!form.quantity || form.quantity <= 0) e.quantity = "Quantity must be > 0";
    if (!form.notes.trim()) e.notes = "Reason is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch(
        mode === "add"
          ? "/api/inventory-adjustments"
          : `/api/inventory-adjustments/${initialData.id}`,
        {
          method: mode === "add" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save inventory adjustment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "New Inventory Adjustment" : "Edit Inventory Adjustment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* PRODUCT */}
            <div className="space-y-1">
              <Label>Product *</Label>
              <div className="flex gap-2">
                <Input value={form.productName} readOnly />
                <Button onClick={() => setOpenProductModal(true)}>Select</Button>
              </div>
              {errors.product && <p className="text-red-500 text-sm">{errors.product}</p>}
            </div>

            {/* TYPE */}
            <div className="space-y-1">
              <Label>Adjustment Type *</Label>
              <Select
                value={form.adjustmentType}
                onValueChange={(v: any) => setForm((f) => ({ ...f, adjustmentType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Increase">Increase</SelectItem>
                  <SelectItem value="Decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* QUANTITY */}
            <div className="space-y-1">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                }
              />
              {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
            </div>

            {/* NOTES */}
            <div className="space-y-1">
              <Label>Reason *</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
              {errors.notes && <p className="text-red-500 text-sm">{errors.notes}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRODUCT SELECT */}
      <ProductSelectModal
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        onSelect={(p) => {
          setForm((f) => ({
            ...f,
            productId: p.id,
            productName: p.productName,
          }));
          setOpenProductModal(false);
        }}
      />
    </>
  );
}
