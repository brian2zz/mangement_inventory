"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Package,
  Layers,
  Calendar,
  Building2,
  Warehouse,
  Sparkles,
  Truck,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import CustomerSelectModal from "@/components/selectors/CustomerSelectModal";
import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";
import { apiFetch } from "@/lib/api";

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

export default function AddOutgoingProductPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Header data
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
    {
      id: Date.now().toString(),
      productId: null,
      productName: null,
      partNumber: null,
      quantity: 1,
      unitPrice: 0,
      stock: 0,
      notes: "",
    },
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

  const handleProductSelect = (p: {
    id: number;
    productName: string;
    partNumber?: string | null;
    unitPrice?: number;
    stock?: number;
  }) => {
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
      {
        id: Date.now().toString(),
        productId: null,
        productName: null,
        partNumber: null,
        quantity: 1,
        unitPrice: 0,
        stock: 0,
        notes: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItemField = <K extends keyof ProductItem>(
    id: string,
    field: K,
    value: ProductItem[K]
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // ======= Validation & totals =======
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.date) newErrors.date = "Tanggal pengeluaran wajib diisi";
    if (!formData.customerId) newErrors.customer = "Customer penerima wajib dipilih";
    if (!formData.warehouseId) newErrors.warehouse = "Gudang asal wajib dipilih";

    items.forEach((item, idx) => {
      if (!item.productId) newErrors[`item_${idx}_product`] = "Pilih produk";
      if (!item.quantity || item.quantity <= 0)
        newErrors[`item_${idx}_quantity`] = "Jumlah minimal 1";

      if (
        formData.submitStatus === "Done" &&
        item.stock !== undefined &&
        item.quantity > (item.stock ?? 0)
      ) {
        newErrors[`item_${idx}_quantity`] = `Stok tidak mencukupi (Tersedia: ${item.stock ?? 0})`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const totalItems = items.reduce(
      (s, it) => s + (Number(it.quantity) || 0),
      0
    );
    const totalValue = items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    return { totalItems, totalValue };
  };

  // ======= Save handler =======
  const handleSave = async (status: "Draft" | "Done") => {
    formData.submitStatus = status;
    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      customerId: Number(formData.customerId),
      warehouseId: Number(formData.warehouseId),
      transaction_date: formData.date,
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
    };

    try {
      const res = await apiFetch("/outgoing-transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan pengeluaran barang");
      }

      alert(`✅ Transaksi keluar berhasil disimpan sebagai ${status}!`);
      router.push("/outgoing");
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal memproses transaksi"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const { totalItems, totalValue } = calculateTotals();

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 shadow-xs transition-all duration-300 text-pink-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Barang Keluar Baru
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100/70 text-rose-700">
                <Truck className="w-3 h-3 text-rose-500" /> Distribusi & Pengiriman
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Catat pengeluaran dan pengurangan stok barang untuk pesanan customer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => handleSave("Draft")}
            disabled={isLoading}
            className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-xs font-semibold"
          >
            Simpan Draft
          </Button>
          <Button
            onClick={() => handleSave("Done")}
            disabled={isLoading}
            className="btn-gradient rounded-full px-5 text-xs font-semibold shadow-md border-0"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {isLoading ? "Memproses..." : "Selesai (Done)"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Unit Keluar
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-pink-600 mt-1">
              {totalItems} Unit
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-100/70 flex items-center justify-center text-pink-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estimasi Nilai Barang
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
              Rp {totalValue.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 col-span-2 lg:col-span-1 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status Pembuatan
            </div>
            <div className="mt-1">
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                DRAFT / SIAP DISUBMIT
              </Badge>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Form Informasi Pengeluaran */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
          <Building2 className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            Informasi Transaksi Pengeluaran
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* Tanggal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Tanggal Pengeluaran <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((p) => ({ ...p, date: e.target.value }))
              }
              className={`bg-white/80 rounded-xl text-xs sm:text-sm ${
                errors.date ? "border-red-500" : "border-pink-200/80"
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs">{errors.date}</p>
            )}
          </div>

          {/* Customer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Customer / Penerima <span className="text-rose-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={formData.customerName}
                readOnly
                placeholder="Pilih customer tujuan..."
                className={`bg-white/80 rounded-xl text-xs sm:text-sm ${
                  errors.customer ? "border-red-500" : "border-pink-200/80"
                }`}
              />
              <Button
                type="button"
                onClick={() => setOpenCustomerModal(true)}
                className="btn-gradient rounded-xl px-4 text-xs font-medium shrink-0 border-0"
              >
                Pilih
              </Button>
            </div>
            {errors.customer && (
              <p className="text-red-500 text-xs">{errors.customer}</p>
            )}
          </div>

          {/* Gudang Asal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Gudang Asal <span className="text-rose-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={formData.warehouseName}
                readOnly
                placeholder="Pilih gudang asal pengeluaran..."
                className={`bg-white/80 rounded-xl text-xs sm:text-sm ${
                  errors.warehouse ? "border-red-500" : "border-pink-200/80"
                }`}
              />
              <Button
                type="button"
                onClick={() => setOpenWarehouseModal(true)}
                className="btn-gradient rounded-xl px-4 text-xs font-medium shrink-0 border-0"
              >
                Pilih
              </Button>
            </div>
            {errors.warehouse && (
              <p className="text-red-500 text-xs">{errors.warehouse}</p>
            )}
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Catatan / Referensi Surat Jalan
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              placeholder="Contoh: No PO Customer, ekspedisi atau supir..."
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* Daftar Item Produk */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/60">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              Daftar Barang yang Dikeluarkan
            </h2>
          </div>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            className="rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 text-xs font-semibold px-3"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tambah Baris Produk
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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end">
                {/* Produk */}
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-medium text-gray-600">
                    Produk <span className="text-rose-500">*</span>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={item.productName ?? ""}
                      readOnly
                      placeholder="Klik pilih produk..."
                      className={`bg-white rounded-xl text-xs h-9 ${
                        errors[`item_${idx}_product`]
                          ? "border-red-500"
                          : "border-pink-200/80"
                      }`}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setActiveItemId(item.id);
                        setOpenProductModal(true);
                      }}
                      className="btn-gradient rounded-xl px-3 h-9 text-xs shrink-0 border-0"
                    >
                      Pilih
                    </Button>
                  </div>
                  {errors[`item_${idx}_product`] && (
                    <p className="text-red-500 text-[11px]">
                      {errors[`item_${idx}_product`]}
                    </p>
                  )}
                </div>

                {/* Part Number */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Part Number
                  </Label>
                  <Input
                    value={item.partNumber ?? "-"}
                    readOnly
                    className="bg-gray-50/80 rounded-xl text-xs h-9 text-gray-500 border-pink-100"
                  />
                </div>

                {/* Jumlah Keluar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-600">
                      Jumlah <span className="text-rose-500">*</span>
                    </Label>
                    {item.stock !== undefined && (
                      <span className="text-[10px] text-gray-400 font-semibold">
                        Stok: {item.stock}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity || ""}
                    onChange={(e) =>
                      updateItemField(
                        item.id,
                        "quantity",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={`bg-white rounded-xl text-xs h-9 ${
                      errors[`item_${idx}_quantity`]
                        ? "border-red-500"
                        : "border-pink-200/80"
                    }`}
                  />
                  {errors[`item_${idx}_quantity`] && (
                    <p className="text-red-500 text-[11px]">
                      {errors[`item_${idx}_quantity`]}
                    </p>
                  )}
                </div>

                {/* Harga Satuan */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Harga Satuan (Rp)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice || ""}
                    onChange={(e) =>
                      updateItemField(
                        item.id,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="bg-white rounded-xl text-xs h-9 border-pink-200/80"
                  />
                </div>
              </div>

              {/* Catatan Item & Subtotal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-pink-50/70">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Catatan khusus item (opsional)..."
                    value={item.notes || ""}
                    onChange={(e) =>
                      updateItemField(item.id, "notes", e.target.value)
                    }
                    className="bg-white/60 rounded-lg text-xs h-8 border-pink-100"
                  />
                </div>
                <div className="text-xs text-gray-600 font-medium self-end sm:self-auto">
                  Subtotal:{" "}
                  <span className="font-bold text-rose-600">
                    Rp {((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-full bg-white/80 border-pink-200 text-gray-600 text-xs px-5 font-semibold"
        >
          Batal
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave("Draft")}
          disabled={isLoading}
          className="rounded-full bg-white/80 border-pink-200 text-pink-700 hover:bg-pink-50 text-xs px-5 font-semibold"
        >
          Simpan Draft
        </Button>
        <Button
          onClick={() => handleSave("Done")}
          disabled={isLoading}
          className="btn-gradient rounded-full px-6 text-xs font-semibold shadow-md border-0"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          {isLoading ? "Menyimpan..." : "Selesaikan Pengeluaran"}
        </Button>
      </div>

      {/* Modals */}
      <CustomerSelectModal
        open={openCustomerModal}
        onClose={() => setOpenCustomerModal(false)}
        onSelect={handleCustomerSelect}
      />
      <WarehouseSelectModal
        open={openWarehouseModal}
        onClose={() => setOpenWarehouseModal(false)}
        onSelect={handleWarehouseSelect}
      />
      <ProductSelectModal
        open={openProductModal}
        onClose={() => {
          setOpenProductModal(false);
          setActiveItemId(null);
        }}
        onSelect={handleProductSelect}
      />
    </div>
  );
}
