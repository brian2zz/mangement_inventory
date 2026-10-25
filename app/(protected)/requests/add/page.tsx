"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Sparkles,
  Layers,
  ClipboardList,
  CheckCircle2,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface Item {
  id: string;
  product_name: string;
  requested_quantity: number | "";
  fulfilled_quantity: number | "";
  unit_price: number | "";
}

export default function AddProductRequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  /* ================= HEADER ================= */
  const [formData, setFormData] = React.useState({
    requestDate: new Date().toISOString().split("T")[0],
    fulfilledDate: "",
    store: "",
    supplier: "",
    notes: "",
  });

  /* ================= ITEMS ================= */
  const [items, setItems] = React.useState<Item[]>([
    {
      id: Date.now().toString(),
      product_name: "",
      requested_quantity: 1,
      fulfilled_quantity: 0,
      unit_price: 0,
    },
  ]);

  /* ================= ITEM HANDLERS ================= */
  const addItem = () => {
    setItems((p) => [
      ...p,
      {
        id: Date.now().toString(),
        product_name: "",
        requested_quantity: 1,
        fulfilled_quantity: 0,
        unit_price: 0,
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems((p) => p.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: string,
    field: keyof Item,
    value: number | string
  ) => {
    setItems((p) =>
      p.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  /* ================= TOTALS ================= */
  const totalRequestedQty = items.reduce(
    (s, i) => s + (Number(i.requested_quantity) || 0),
    0
  );

  const totalFulfilledQty = items.reduce(
    (s, i) => s + (Number(i.fulfilled_quantity) || 0),
    0
  );

  const totalPrice = items.reduce(
    (s, i) =>
      s + (Number(i.fulfilled_quantity) || 0) * (Number(i.unit_price) || 0),
    0
  );

  const status =
    totalFulfilledQty === 0
      ? "Pending"
      : totalFulfilledQty < totalRequestedQty
      ? "Partial"
      : "Fulfilled";

  /* ================= VALIDATION ================= */
  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.requestDate)
      errs.requestDate = "Tanggal permintaan wajib diisi";
    if (!formData.store) errs.store = "Nama toko / unit cabang wajib diisi";

    items.forEach((it, idx) => {
      if (!it.product_name)
        errs[`item_${idx}_product`] = "Nama produk wajib diisi";
      if (!it.requested_quantity || Number(it.requested_quantity) <= 0)
        errs[`item_${idx}_req`] = "Qty diminta min 1";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload = {
        requestDate: formData.requestDate,
        fulfilledDate: formData.fulfilledDate || null,
        store: formData.store,
        supplier: formData.supplier || null,
        notes: formData.notes || null,
        status,
        items: items.map((i) => ({
          product_name: i.product_name,
          requested_quantity: Number(i.requested_quantity || 0),
          fulfilled_quantity: Number(i.fulfilled_quantity || 0),
          unit_price: Number(i.unit_price || 0),
          total_price:
            Number(i.fulfilled_quantity || 0) * Number(i.unit_price || 0),
        })),
      };

      const res = await apiFetch("/product-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal membuat permintaan produk");
      }

      alert("✅ Permintaan barang berhasil diajukan!");
      router.push("/requests");
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal menyimpan permintaan"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 shadow-xs text-pink-600 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Permintaan Barang Baru
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <ClipboardList className="w-3 h-3 text-pink-500" /> Form Permintaan
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Ajukan permintaan alokasi atau restock barang untuk cabang / unit operasional
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full bg-white/80 border-pink-200 text-gray-600 text-xs px-4"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-gradient rounded-full px-5 text-xs font-semibold shadow-md border-0"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {isLoading ? "Mengirim..." : "Ajukan Permintaan"}
          </Button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Diminta
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-pink-600 mt-1">
              {totalRequestedQty} Unit
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-100/70 flex items-center justify-center text-pink-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Dipenuhi
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
              {totalFulfilledQty} Unit
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estimasi Nilai
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-rose-600 mt-1 truncate">
              {formatRupiah(totalPrice)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status Kalkulasi
            </div>
            <div className="mt-1">
              {status === "Fulfilled" ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                  TERPENUHI
                </Badge>
              ) : status === "Partial" ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                  SEBAGIAN
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                  PENDING
                </Badge>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* REQUEST INFORMATION */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
          <Building2 className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            Informasi Permintaan Cabang
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* TANGGAL REQUEST */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Tanggal Permintaan <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.requestDate}
              onChange={(e) =>
                setFormData({ ...formData, requestDate: e.target.value })
              }
              className={`bg-white/80 rounded-xl text-xs sm:text-sm ${
                errors.requestDate ? "border-red-500" : "border-pink-200/80"
              }`}
            />
            {errors.requestDate && (
              <p className="text-red-500 text-xs">{errors.requestDate}</p>
            )}
          </div>

          {/* TANGGAL DIPENUHI */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Tanggal Rencana Dipenuhi (Opsional)
            </Label>
            <Input
              type="date"
              value={formData.fulfilledDate}
              onChange={(e) =>
                setFormData({ ...formData, fulfilledDate: e.target.value })
              }
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>

          {/* STORE */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Toko / Unit Cabang Peminta <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="Contoh: Toko Cabang Surabaya, Unit Barista..."
              value={formData.store}
              onChange={(e) =>
                setFormData({ ...formData, store: e.target.value })
              }
              className={`bg-white/80 rounded-xl text-xs sm:text-sm ${
                errors.store ? "border-red-500" : "border-pink-200/80"
              }`}
            />
            {errors.store && (
              <p className="text-red-500 text-xs">{errors.store}</p>
            )}
          </div>

          {/* SUPPLIER */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Vendor / Supplier Rekomendasi (Opsional)
            </Label>
            <Input
              placeholder="Nama vendor jika ada referensi..."
              value={formData.supplier}
              onChange={(e) =>
                setFormData({ ...formData, supplier: e.target.value })
              }
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-gray-700">
              Keterangan & Catatan Kebutuhan
            </Label>
            <Textarea
              placeholder="Catatan tambahan keperluan pengajuan barang..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/60">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              Daftar Barang yang Diajukan
            </h2>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 text-xs font-semibold px-3"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tambah Baris Barang
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-pink-200/70 hover:border-pink-300 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between pb-1 border-b border-pink-50">
                <span className="font-bold text-xs text-pink-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  Barang #{idx + 1}
                </span>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
                {/* Product Name */}
                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Nama Barang <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="Nama barang yang diminta..."
                    value={item.product_name}
                    onChange={(e) =>
                      updateItem(item.id, "product_name", e.target.value)
                    }
                    className={`bg-white rounded-xl text-xs h-9 ${
                      errors[`item_${idx}_product`]
                        ? "border-red-500"
                        : "border-pink-200/80"
                    }`}
                  />
                  {errors[`item_${idx}_product`] && (
                    <p className="text-red-500 text-[11px]">
                      {errors[`item_${idx}_product`]}
                    </p>
                  )}
                </div>

                {/* Requested Qty */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Jumlah Diminta <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={item.requested_quantity}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "requested_quantity",
                        e.target.value === "" ? "" : parseInt(e.target.value) || 0
                      )
                    }
                    className={`bg-white rounded-xl text-xs h-9 ${
                      errors[`item_${idx}_req`]
                        ? "border-red-500"
                        : "border-pink-200/80"
                    }`}
                  />
                  {errors[`item_${idx}_req`] && (
                    <p className="text-red-500 text-[11px]">
                      {errors[`item_${idx}_req`]}
                    </p>
                  )}
                </div>

                {/* Fulfilled Qty */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Jumlah Dipenuhi (Gudang)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.fulfilled_quantity}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "fulfilled_quantity",
                        e.target.value === "" ? "" : parseInt(e.target.value) || 0
                      )
                    }
                    className="bg-white rounded-xl text-xs h-9 border-pink-200/80"
                  />
                </div>

                {/* Unit Price */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Harga Satuan (Rp)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "unit_price",
                        e.target.value === "" ? "" : parseFloat(e.target.value) || 0
                      )
                    }
                    className="bg-white rounded-xl text-xs h-9 border-pink-200/80"
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex justify-end pt-1 border-t border-pink-50/70 text-xs text-gray-600 font-medium">
                Subtotal Nilai Dipenuhi:{" "}
                <span className="font-bold text-rose-600 ml-1.5">
                  {formatRupiah(
                    (Number(item.fulfilled_quantity) || 0) *
                      (Number(item.unit_price) || 0)
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-full bg-white/80 border-pink-200 text-gray-600 text-xs px-5 font-semibold"
        >
          Batal
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="btn-gradient rounded-full px-6 text-xs font-semibold shadow-md border-0"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {isLoading ? "Mengirim..." : "Ajukan Permintaan"}
        </Button>
      </div>
    </div>
  );
}
