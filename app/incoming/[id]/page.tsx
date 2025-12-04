"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Edit, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal";
import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";

/**
 * Page: app/incoming/[id]/page.tsx
 *
 * Behavior:
 * - Loads detail from GET /api/incoming-transactions/:id
 * - Draft: can edit supplier, warehouse, date, notes, items (add/remove/edit)
 * - Done: can only edit transactionDate & notes
 * - Save Draft -> PUT with full payload (when status = Draft)
 * - Submit (Done) -> PUT with status = "Done" (transition triggers stock update on backend)
 * - Delete -> DELETE /api/incoming-transactions/:id (backend will rollback stock if Done)
 *
 * Requires selector components:
 * - components/selectors/SupplierSelectModal.tsx
 * - components/selectors/WarehouseSelectModal.tsx
 * - components/selectors/ProductSelectModal.tsx
 */

type APIItem = {
  id: number;
  productId: number;
  productName?: string | null;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  product?: { id: number; name?: string; stock?: number } | null;
};

type APIPayload = {
  id: number;
  transactionDate: string;
  supplierId?: number | null;
  supplier?: { id: number; name?: string } | null;
  warehouseId?: number | null;
  warehouse?: { id: number; name?: string } | null;
  notes?: string | null;
  status: string;
  totalItems: number;
  totalValue: number;
  items: APIItem[];
  createdBy?: { id: number; name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

type ItemRow = {
  id: string; // string for row identity
  productId: number | null;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  stock?: number;
  notes?: string | null;
};

export default function IncomingEditPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const idParam = params?.id ?? "";

  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // header form state
  const [header, setHeader] = React.useState({
    transactionDate: new Date().toISOString().split("T")[0],
    supplierId: null as number | null,
    supplierName: "",
    warehouseId: null as number | null,
    warehouseName: "",
    notes: "",
    status: "Draft" as "Draft" | "Done" | string,
  });

  // items
  const [items, setItems] = React.useState<ItemRow[]>([]);

  // validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // modals + active item
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false);
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  // load detail
  React.useEffect(() => {
    if (!idParam) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/incoming-transactions/${idParam}`);
        if (!res.ok) throw new Error("Failed to fetch transaction");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load");

        const d: APIPayload = json.data;

        setHeader({
          transactionDate: d.transactionDate ? new Date(d.transactionDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          supplierId: d.supplierId ?? null,
          supplierName: d.supplier?.name ?? "",
          warehouseId: d.warehouseId ?? null,
          warehouseName: d.warehouse?.name ?? "",
          notes: d.notes ?? "",
          status: d.status ?? "Draft",
        });

        const mapped = (d.items || []).map((it) => ({
          id: String(it.id),
          productId: it.productId ?? null,
          productName: it.productName ?? it.product?.name ?? null,
          partNumber: undefined,
          quantity: it.quantity ?? 0,
          unitPrice: Number(it.unitPrice ?? 0),
          stock: it.product?.stock ?? 0,
          notes: it.notes ?? null,
        })) as ItemRow[];

        setItems(mapped);
      } catch (err) {
        console.error(err);
        alert("Gagal memuat detail transaksi.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [idParam]);

  // helpers
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), productId: null, productName: null, partNumber: null, quantity: 0, unitPrice: 0, stock: 0, notes: "" },
    ]);

  const removeItem = (rowId: string) => setItems((prev) => prev.filter((r) => r.id !== rowId));

  const updateItem = <K extends keyof ItemRow>(rowId: string, field: K, value: ItemRow[K]) =>
    setItems((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));

  // modal callbacks
  const onSupplierSelect = (s: { id: number; name: string }) => setHeader((h) => ({ ...h, supplierId: s.id, supplierName: s.name }));
  const onWarehouseSelect = (w: { id: number; name: string }) => setHeader((h) => ({ ...h, warehouseId: w.id, warehouseName: w.name }));
  const onProductSelect = (p: { id: number; productName: string; partNumber?: string | null; unitPrice?: number; stock?: number }) => {
    if (!activeItemId) return;
    updateItem(activeItemId, "productId", p.id);
    updateItem(activeItemId, "productName", p.productName ?? null);
    updateItem(activeItemId, "partNumber", p.partNumber ?? null);
    updateItem(activeItemId, "unitPrice", Number(p.unitPrice ?? 0));
    updateItem(activeItemId, "stock", Number(p.stock ?? 0));
    setActiveItemId(null);
  };

  // validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!header.transactionDate) errs.transactionDate = "Date is required";
    if (!header.supplierId) errs.supplier = "Supplier is required";
    if (!header.warehouseId) errs.warehouse = "Warehouse is required";

    // if Draft, validate item-level
    if (header.status === "Draft") {
      items.forEach((it, idx) => {
        if (!it.productId) errs[`item_${idx}_product`] = "Product is required";
        if (!it.quantity || it.quantity <= 0) errs[`item_${idx}_quantity`] = "Quantity must be > 0";
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const totals = React.useMemo(() => {
    const totalItems = items.reduce((s, it) => s + (it.quantity || 0), 0);
    const totalValue = items.reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0);
    return { totalItems, totalValue };
  }, [items]);

  // Save Draft (or generic save when header.status === 'Done' only allows date & notes)
  const handleSave = async () => {
    // If not in editing mode, toggle to editing
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // validate
    if (!validate()) {
      alert("Periksa validasi sebelum menyimpan.");
      return;
    }

    setLoading(true);
    try {
      let payload: any = {};

      // If original status is Done, backend accepts only date & notes (we follow that rule)
      if (header.status === "Done") {
        payload.transactionDate = header.transactionDate;
        payload.notes = header.notes;
        // allow updating status if user still chooses to keep "Done"
        payload.status = header.status;
      } else {
        // Draft -> full update allowed
        payload = {
          supplierId: header.supplierId,
          warehouseId: header.warehouseId,
          transactionDate: header.transactionDate,
          notes: header.notes,
          status: header.status,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes,
          })),
        };
      }

      const res = await fetch(`/api/incoming-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error("PUT error", json);
        throw new Error(json?.error || "Failed to update");
      }

      alert("Berhasil menyimpan.");
      setIsEditing(false);

      // reload or navigate to detail (we reload current page by reloading)
      router.push(`/incoming/${idParam}`);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  // Submit -> change status to Done (only if currently Draft)
  const handleSubmitDone = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    // Only allow transition if currently Draft
    if (header.status !== "Draft") return alert("Hanya transaksi Draft yang bisa disubmit.");

    // validate fully
    if (!validate()) {
      alert("Periksa validasi sebelum submit.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status: "Done",
        supplierId: header.supplierId,
        warehouseId: header.warehouseId,
        transactionDate: header.transactionDate,
        notes: header.notes,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
        })),
      };

      const res = await fetch(`/api/incoming-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error("Submit error", json);
        throw new Error(json?.error || "Failed to submit");
      }

      alert("Transaksi berhasil disubmit (Done).");
      router.push(`/incoming/${idParam}`);
    } catch (err) {
      console.error(err);
      alert("Gagal submit transaksi.");
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirm("Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/incoming-transactions/${idParam}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to delete");
      }
      alert("Transaksi dihapus.");
      router.push("/incoming");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus transaksi.");
    } finally {
      setDeleting(false);
    }
  };

  const isDone = header.status === "Done";
  const canEditHeader = isEditing && !isDone;
  const canEditItems = isEditing && !isDone;

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Incoming Transaction #{idParam}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="btn-gradient border-0">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="bg-white/80">
                Cancel
              </Button>

              {/* Save Draft */}
              <Button onClick={handleSave} disabled={loading} className="btn-gradient border-0">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Draft"}
              </Button>

              {/* Submit -> only show when Draft */}
              {header.status === "Draft" && (
                <Button onClick={handleSubmitDone} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Submitting..." : "Submit (Done)"}
                </Button>
              )}
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting} className="bg-gradient-to-r from-red-500 to-red-600 border-0">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting this transaction {isDone ? "will rollback stock and " : ""}permanently remove it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-gradient-to-r from-red-500 to-red-600">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-pink-600">{totals.totalItems}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-green-600">${totals.totalValue.toFixed(2)}</div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge variant={isDone ? "default" : "secondary"} className="mt-1">
            {header.status}
          </Badge>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Date</div>
          <div className="text-lg font-medium text-gray-800">{header.transactionDate}</div>
        </div>
      </div>

      {/* header form */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Date {isEditing && "*"}</Label>
              <Input
                type="date"
                value={header.transactionDate}
                onChange={(e) => setHeader((h) => ({ ...h, transactionDate: e.target.value }))}
                className={errors.transactionDate ? "border-red-500" : ""}
                disabled={!isEditing}
              />
              {errors.transactionDate && <p className="text-red-500 text-sm">{errors.transactionDate}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Supplier {isEditing && header.status === "Draft" ? "*" : ""}</Label>
              <div className="flex items-center gap-2">
                <Input value={header.supplierName} readOnly />
                <Button onClick={() => isEditing && header.status === "Draft" && setOpenSupplierModal(true)} disabled={!isEditing || header.status !== "Draft"}>
                  Select
                </Button>
              </div>
              {errors.supplier && <p className="text-red-500 text-sm">{errors.supplier}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Warehouse {isEditing && header.status === "Draft" ? "*" : ""}</Label>
              <div className="flex items-center gap-2">
                <Input value={header.warehouseName} readOnly />
                <Button onClick={() => isEditing && header.status === "Draft" && setOpenWarehouseModal(true)} disabled={!isEditing || header.status !== "Draft"}>
                  Select
                </Button>
              </div>
              {errors.warehouse && <p className="text-red-500 text-sm">{errors.warehouse}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={header.notes} onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))} rows={3} disabled={!isEditing} />
            </div>
          </div>
        </div>
      </div>

      {/* items */}
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle>Product Items</CardTitle>
            {isEditing && header.status === "Draft" && (
              <Button onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {items.map((it, idx) => (
            <div key={it.id} className="p-4 border border-pink-200 rounded-lg bg-white/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Product {idx + 1}</h4>
                {isEditing && header.status === "Draft" && items.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeItem(it.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* product selector */}
                <div className="grid gap-2">
                  <Label>Product {isEditing && header.status === "Draft" ? "*" : ""}</Label>
                  <div className="flex items-center gap-2">
                    <Input value={it.productName ?? ""} readOnly />
                    <Button
                      onClick={() => {
                        if (isEditing && header.status === "Draft") {
                          setActiveItemId(it.id);
                          setOpenProductModal(true);
                        }
                      }}
                      disabled={!isEditing || header.status !== "Draft"}
                    >
                      Select
                    </Button>
                  </div>
                  {errors[`item_${idx}_product`] && <p className="text-red-500 text-sm">{errors[`item_${idx}_product`]}</p>}
                </div>

                {/* part number */}
                <div className="grid gap-2">
                  <Label>Part Number</Label>
                  <Input value={it.partNumber ?? ""} readOnly />
                </div>

                {/* quantity */}
                <div className="grid gap-2">
                  <Label>Quantity {isEditing && header.status === "Draft" ? "*" : ""}</Label>
                  <Input
                    type="number"
                    value={it.quantity}
                    onChange={(e) => {
                      if (isEditing && header.status === "Draft") updateItem(it.id, "quantity", Number(e.target.value || 0));
                    }}
                    disabled={!isEditing || header.status !== "Draft"}
                  />
                  {errors[`item_${idx}_quantity`] && <p className="text-red-500 text-sm">{errors[`item_${idx}_quantity`]}</p>}
                </div>

                {/* unit price */}
                <div className="grid gap-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => {
                      if (isEditing && header.status === "Draft") updateItem(it.id, "unitPrice", Number(e.target.value || 0));
                    }}
                    disabled={!isEditing || header.status !== "Draft"}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input
                  value={it.notes ?? ""}
                  onChange={(e) => {
                    if (isEditing && header.status === "Draft") updateItem(it.id, "notes", e.target.value);
                  }}
                  disabled={!isEditing || header.status !== "Draft"}
                />
              </div>

              <div className="flex justify-end">
                <div className="text-sm text-gray-600">
                  Subtotal: <span className="font-medium text-green-600">${(it.quantity * it.unitPrice).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* selectors modals */}
      <SupplierSelectModal open={openSupplierModal} onClose={() => setOpenSupplierModal(false)} onSelect={onSupplierSelect} />
      <WarehouseSelectModal open={openWarehouseModal} onClose={() => setOpenWarehouseModal(false)} onSelect={onWarehouseSelect} />
      <ProductSelectModal open={openProductModal} onClose={() => setOpenProductModal(false)} onSelect={onProductSelect} />
    </div>
  );
}
