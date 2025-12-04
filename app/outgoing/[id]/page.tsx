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

import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";
import CustomerSelectModal from "@/components/selectors/CustomerSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";

// ==== TYPES DARI API (MIRIP INCOMING) ====

type APIItem = {
  id: number;
  productId: number;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  notes?: string | null;
};

type APIPayload = {
  id: number;
  transactionDate: string;
  customerId?: number | null;
  customer?: { id: number; name?: string } | null;
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

type StatusType = "Draft" | "Done" | string;

type ItemRow = {
  id: string;
  productId: number | null;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
};

export default function OutgoingEditPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const idParam = params?.id ?? "";

  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // HEADER STATE
  const [header, setHeader] = React.useState({
    transactionDate: new Date().toISOString().split("T")[0],
    warehouseId: null as number | null,
    warehouseName: "",
    customerId: null as number | null,
    customerName: "",
    notes: "",
    status: "Draft" as StatusType,
  });

  // ITEMS
  const [items, setItems] = React.useState<ItemRow[]>([]);

  // VALIDATION ERRORS
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // MODALS
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openCustomerModal, setOpenCustomerModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  // ================== LOAD DETAIL (GET) ==================
  React.useEffect(() => {
    if (!idParam) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/outgoing-transactions/${idParam}`);
        if (!res.ok) throw new Error("Failed to fetch transaction");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load");

        const d: APIPayload = json.data;

        setHeader({
          transactionDate: d.transactionDate
            ? new Date(d.transactionDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          warehouseId: d.warehouseId ?? null,
          warehouseName: d.warehouse?.name ?? "",
          customerId: d.customerId ?? null,
          customerName: d.customer?.name ?? "",
          notes: d.notes ?? "",
          status: d.status ?? "Draft",
        });

        const mapped = (d.items || []).map((it) => ({
          id: String(it.id),
          productId: it.productId ?? null,
          productName: it.productName ?? null,
          partNumber: it.partNumber ?? null,
          quantity: it.quantity ?? 0,
          unitPrice: Number(it.unitPrice ?? 0),
          notes: it.notes ?? null,
        })) as ItemRow[];

        setItems(mapped.length ? mapped : [
          {
            id: Date.now().toString(),
            productId: null,
            productName: null,
            partNumber: null,
            quantity: 0,
            unitPrice: 0,
            notes: "",
          },
        ]);
      } catch (err) {
        console.error(err);
        alert("Failed to load outgoing transaction.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [idParam]);

  // ================== HELPERS ==================
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        productId: null,
        productName: null,
        partNumber: null,
        quantity: 0,
        unitPrice: 0,
        notes: "",
      },
    ]);

  const removeItem = (rowId: string) =>
    setItems((prev) => prev.filter((r) => r.id !== rowId));

  const updateItem = <K extends keyof ItemRow>(
    rowId: string,
    field: K,
    value: ItemRow[K]
  ) =>
    setItems((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r))
    );

  // MODAL CALLBACKS
  const onWarehouseSelect = (w: { id: number; name: string }) =>
    setHeader((h) => ({ ...h, warehouseId: w.id, warehouseName: w.name }));

  const onCustomerSelect = (c: { id: number; name: string }) =>
    setHeader((h) => ({ ...h, customerId: c.id, customerName: c.name }));

  const onProductSelect = (p: {
    id: number;
    productName: string;
    partNumber?: string | null;
    unitPrice?: number;
  }) => {
    if (!activeItemId) return;
    updateItem(activeItemId, "productId", p.id);
    updateItem(activeItemId, "productName", p.productName ?? null);
    updateItem(activeItemId, "partNumber", p.partNumber ?? null);
    updateItem(activeItemId, "unitPrice", Number(p.unitPrice ?? 0));
    setActiveItemId(null);
    setOpenProductModal(false);
  };

  // ================== VALIDATION ==================
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!header.transactionDate) errs.transactionDate = "Date is required";
    if (!header.warehouseId) errs.warehouse = "Warehouse is required";
    if (!header.customerId) errs.customer = "Customer is required";

    // Jika Draft, validate item detail
    if (header.status === "Draft") {
      items.forEach((it, idx) => {
        if (!it.productId)
          errs[`item_${idx}_product`] = "Product is required";
        if (!it.quantity || it.quantity <= 0)
          errs[`item_${idx}_quantity`] = "Quantity must be > 0";
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ================== TOTALS ==================
  const totals = React.useMemo(() => {
    const totalItems = items.reduce(
      (s, it) => s + (it.quantity || 0),
      0
    );
    const totalValue = items.reduce(
      (s, it) => s + (it.quantity || 0) * (it.unitPrice || 0),
      0
    );
    return { totalItems, totalValue };
  }, [items]);

  // ================== SAVE DRAFT ==================
  const handleSave = async () => {
    // kalau belum masuk mode edit → aktifkan dulu
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!validate()) {
      alert("Periksa validasi sebelum menyimpan.");
      return;
    }

    setLoading(true);
    try {
      let payload: any = {};

      // Jika status sudah Done: hanya boleh ubah tanggal + notes
      if (header.status === "Done") {
        payload.transactionDate = header.transactionDate;
        payload.notes = header.notes;
        payload.status = header.status;
      } else {
        // Draft: boleh update semua
        payload = {
          warehouseId: header.warehouseId,
          customerId: header.customerId,
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

      const res = await fetch(`/api/outgoing-transactions/${idParam}`, {
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
      router.push(`/outgoing/${idParam}`);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  // ================== SUBMIT DONE ==================
  const handleSubmitDone = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (header.status !== "Draft") {
      alert("Hanya transaksi Draft yang bisa disubmit.");
      return;
    }

    if (!validate()) {
      alert("Periksa validasi sebelum submit.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status: "Done",
        warehouseId: header.warehouseId,
        customerId: header.customerId,
        transactionDate: header.transactionDate,
        notes: header.notes,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
        })),
      };

      const res = await fetch(`/api/outgoing-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error("Submit error", json);
        throw new Error(json?.error || "Failed to submit");
      }

      alert("Transaksi berhasil disubmit (Done).");
      router.push(`/outgoing/${idParam}`);
    } catch (err) {
      console.error(err);
      alert("Gagal submit transaksi.");
    } finally {
      setLoading(false);
    }
  };

  // ================== DELETE ==================
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/outgoing-transactions/${idParam}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to delete");
      }
      alert("Transaksi dihapus.");
      router.push("/outgoing");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus transaksi.");
    } finally {
      setDeleting(false);
    }
  };

  const isDone = header.status === "Done";
  const canEditHeader = isEditing; // tapi disable field tertentu kalau Done
  const canEditItems = isEditing && !isDone;

  // ================== RENDER ==================
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER PAGE */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Outgoing Transaction #{idParam}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="btn-gradient border-0"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="bg-white/80"
              >
                Cancel
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="btn-gradient border-0"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Draft"}
              </Button>

              {header.status === "Draft" && (
                <Button
                  onClick={handleSubmitDone}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Submitting..." : "Submit (Done)"}
                </Button>
              )}
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleting}
                className="bg-gradient-to-r from-red-500 to-red-600 border-0"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-sm border-pink-200">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting this transaction{" "}
                  {isDone ? "will rollback stock and " : ""}
                  permanently remove it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
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

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-pink-600">
            {totals.totalItems}
          </div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-red-600">
            ${totals.totalValue.toFixed(2)}
          </div>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Status</div>
          <Badge
            variant={isDone ? "default" : "secondary"}
            className="mt-1"
          >
            {header.status}
          </Badge>
        </div>

        <div className="enhanced-card p-4">
          <div className="text-sm text-gray-600">Date</div>
          <div className="text-lg font-medium text-gray-800">
            {header.transactionDate}
          </div>
        </div>
      </div>

      {/* HEADER FORM */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4">
          Transaction Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {/* DATE */}
            <div className="grid gap-2">
              <Label>Date {isEditing && "*"}</Label>
              <Input
                type="date"
                value={header.transactionDate}
                onChange={(e) =>
                  setHeader((h) => ({
                    ...h,
                    transactionDate: e.target.value,
                  }))
                }
                className={errors.transactionDate ? "border-red-500" : ""}
                disabled={!canEditHeader}
              />
              {errors.transactionDate && (
                <p className="text-red-500 text-sm">
                  {errors.transactionDate}
                </p>
              )}
            </div>

            {/* WAREHOUSE */}
            <div className="grid gap-2">
              <Label>
                Warehouse{" "}
                {isEditing && header.status === "Draft" ? "*" : ""}
              </Label>
              <div className="flex items-center gap-2">
                <Input value={header.warehouseName} readOnly />
                <Button
                  onClick={() =>
                    isEditing &&
                    header.status === "Draft" &&
                    setOpenWarehouseModal(true)
                  }
                  disabled={!isEditing || header.status !== "Draft"}
                >
                  Select
                </Button>
              </div>
              {errors.warehouse && (
                <p className="text-red-500 text-sm">
                  {errors.warehouse}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* CUSTOMER */}
            <div className="grid gap-2">
              <Label>
                Customer{" "}
                {isEditing && header.status === "Draft" ? "*" : ""}
              </Label>
              <div className="flex items-center gap-2">
                <Input value={header.customerName} readOnly />
                <Button
                  onClick={() =>
                    isEditing &&
                    header.status === "Draft" &&
                    setOpenCustomerModal(true)
                  }
                  disabled={!isEditing || header.status !== "Draft"}
                >
                  Select
                </Button>
              </div>
              {errors.customer && (
                <p className="text-red-500 text-sm">
                  {errors.customer}
                </p>
              )}
            </div>

            {/* NOTES */}
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={header.notes}
                onChange={(e) =>
                  setHeader((h) => ({ ...h, notes: e.target.value }))
                }
                rows={3}
                disabled={!canEditHeader}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <Card className="enhanced-card">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <CardTitle>Product Items</CardTitle>
            {canEditItems && (
              <Button onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="p-4 border border-pink-200 rounded-lg bg-white/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Product {idx + 1}</h4>
                {canEditItems && items.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(it.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* PRODUCT SELECT */}
                <div className="grid gap-2">
                  <Label>
                    Product{" "}
                    {isEditing && header.status === "Draft" ? "*" : ""}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input value={it.productName ?? ""} readOnly />
                    <Button
                      onClick={() => {
                        if (canEditItems) {
                          setActiveItemId(it.id);
                          setOpenProductModal(true);
                        }
                      }}
                      disabled={!canEditItems}
                    >
                      Select
                    </Button>
                  </div>
                  {errors[`item_${idx}_product`] && (
                    <p className="text-red-500 text-sm">
                      {errors[`item_${idx}_product`]}
                    </p>
                  )}
                </div>

                {/* PART NUMBER */}
                <div className="grid gap-2">
                  <Label>Part Number</Label>
                  <Input value={it.partNumber ?? ""} readOnly />
                </div>

                {/* QTY */}
                <div className="grid gap-2">
                  <Label>
                    Quantity{" "}
                    {isEditing && header.status === "Draft" ? "*" : ""}
                  </Label>
                  <Input
                    type="number"
                    value={it.quantity}
                    onChange={(e) => {
                      if (canEditItems) {
                        updateItem(
                          it.id,
                          "quantity",
                          Number(e.target.value || 0)
                        );
                      }
                    }}
                    disabled={!canEditItems}
                  />
                  {errors[`item_${idx}_quantity`] && (
                    <p className="text-red-500 text-sm">
                      {errors[`item_${idx}_quantity`]}
                    </p>
                  )}
                </div>

                {/* UNIT PRICE */}
                <div className="grid gap-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.unitPrice}
                    onChange={(e) => {
                      if (canEditItems) {
                        updateItem(
                          it.id,
                          "unitPrice",
                          Number(e.target.value || 0)
                        );
                      }
                    }}
                    disabled={!canEditItems}
                  />
                </div>
              </div>

              {/* NOTES PER ITEM */}
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input
                  value={it.notes ?? ""}
                  onChange={(e) => {
                    if (canEditItems) {
                      updateItem(it.id, "notes", e.target.value);
                    }
                  }}
                  disabled={!canEditItems}
                />
              </div>

              {/* SUBTOTAL */}
              <div className="flex justify-end">
                <div className="text-sm text-gray-600">
                  Subtotal:{" "}
                  <span className="font-medium text-red-600">
                    ${(it.quantity * it.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MODALS */}
      <WarehouseSelectModal
        open={openWarehouseModal}
        onClose={() => setOpenWarehouseModal(false)}
        onSelect={onWarehouseSelect}
      />

      <CustomerSelectModal
        open={openCustomerModal}
        onClose={() => setOpenCustomerModal(false)}
        onSelect={onCustomerSelect}
      />

      <ProductSelectModal
        open={openProductModal}
        onClose={() => {
          setOpenProductModal(false);
          setActiveItemId(null);
        }}
        onSelect={onProductSelect}
      />
    </div>
  );
}
