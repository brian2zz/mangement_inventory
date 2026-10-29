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
  DollarSign,
  Calendar,
  Building2,
  Warehouse,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";
import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";
import { apiFetch } from "@/lib/api";

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
  // ITEMS MANAGEMENT
  // ==========================================================
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
    if (items.length === 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const updateItemField = (id: string, field: keyof ProductItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  // ==========================================================
  // VALIDATION & SAVE
  // ==========================================================
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = "Tanggal transaksi wajib diisi";
    if (!formData.supplierId) newErrors.supplier = "Supplier wajib dipilih";
    if (!formData.warehouseId) newErrors.warehouse = "Gudang tujuan wajib dipilih";

    items.forEach((item, idx) => {
      if (!item.productId) newErrors[`item_${idx}_product`] = "Pilih produk";
      if (!item.quantity || item.quantity <= 0)
        newErrors[`item_${idx}_quantity`] = "Jumlah minimal 1";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalValue = items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
    return { totalItems, totalValue };
  };

  const handleSave = async (submitStatus: "Draft" | "Done") => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        transactionDate: formData.date,
        supplierId: formData.supplierId,
        warehouseId: formData.warehouseId,
        notes: formData.notes,
        status: submitStatus,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
        })),
      };

      const res = await apiFetch("/incoming-transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan transaksi masuk");

      alert(`✅ Transaksi masuk berhasil disimpan sebagai ${submitStatus}!`);
      router.push("/incoming");
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal memproses transaksi"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const { totalItems, totalValue } = calculateTotals();

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 shadow-xs transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Barang Masuk Baru
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Penerimaan Stok
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Catat penerimaan pengiriman barang dari vendor pemasok ke gudang
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => handleSave("Draft")}
            disabled={isLoading}
            className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-sm"
          >
            Simpan Draft
          </Button>
          <Button
            onClick={() => handleSave("Done")}
            disabled={isLoading}
            className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Memproses..." : "Selesai (Done)"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Quantity Masuk</span>
            <div className="p-2.5 rounded-xl bg-pink-100/70 text-pink-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{totalItems} Unit</div>
          <p className="text-xs text-pink-600 font-medium mt-1">Akumulasi seluruh baris item</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Nilai Pembelian</span>
            <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1">Kalkulasi Qty × Unit Price</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah Jenis Produk</span>
            <div className="p-2.5 rounded-xl bg-purple-100/70 text-purple-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{items.length} Macam</div>
          <p className="text-xs text-purple-700 font-medium mt-1">Baris item dalam dokumen ini</p>
        </div>
      </div>

      {/* Transaction Information */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Informasi Dokumen Penerimaan</h2>
            <p className="text-xs text-gray-500">Tentukan tanggal terima, vendor pengirim, dan gudang penampung</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* DATE */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Tanggal Masuk <span className="text-pink-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((s) => ({ ...s, date: e.target.value }))}
                className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                  errors.date ? "border-rose-400" : ""
                }`}
              />
              {errors.date && <p className="text-rose-500 text-xs mt-0.5">{errors.date}</p>}
            </div>

            {/* SUPPLIER */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Pemasok (Supplier) <span className="text-pink-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.supplierName}
                  readOnly
                  placeholder="Klik tombol pilih..."
                  className={`rounded-xl border-pink-200/80 h-11 bg-gray-50/80 text-gray-700 ${
                    errors.supplier ? "border-rose-400" : ""
                  }`}
                />
                <Button
                  type="button"
                  onClick={() => setOpenSupplierModal(true)}
                  className="rounded-xl px-4 h-11 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 shadow-none font-semibold text-xs"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1" /> Pilih
                </Button>
              </div>
              {errors.supplier && <p className="text-rose-500 text-xs mt-0.5">{errors.supplier}</p>}
            </div>

            {/* WAREHOUSE */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Gudang Tujuan <span className="text-pink-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={formData.warehouseName || ""}
                  readOnly
                  placeholder="Klik tombol pilih..."
                  className={`rounded-xl border-pink-200/80 h-11 bg-gray-50/80 text-gray-700 ${
                    errors.warehouse ? "border-rose-400" : ""
                  }`}
                />
                <Button
                  type="button"
                  onClick={() => setOpenWarehouseModal(true)}
                  className="rounded-xl px-4 h-11 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 shadow-none font-semibold text-xs"
                >
                  <Warehouse className="w-3.5 h-3.5 mr-1" /> Pilih
                </Button>
              </div>
              {errors.warehouse && <p className="text-rose-500 text-xs mt-0.5">{errors.warehouse}</p>}
            </div>
          </div>

          {/* NOTES */}
          <div className="grid gap-2 mt-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Catatan Penerimaan</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData((s) => ({ ...s, notes: e.target.value }))}
              rows={2}
              placeholder="Nomor Surat Jalan pengiriman dari vendor, kondisi kemasan, dsb..."
              className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
            />
          </div>
        </div>
      </div>

      {/* PRODUCTS LIST */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Rincian Barang Masuk</h2>
              <p className="text-xs text-gray-500">Pilih produk katalog, tentukan volume unit dan harga beli</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={addItem}
            className="btn-gradient border-0 rounded-full px-4 h-9 shadow-xs text-xs font-semibold"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Baris Produk
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white/70 border border-pink-100/80 shadow-xs space-y-4 hover:border-pink-200 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-pink-100/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {item.productName || "Pilih Produk Baru..."}
                  </span>
                </div>
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-rose-600 hover:bg-rose-50 rounded-full h-8 px-2.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* PRODUCT SELECT */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Produk <span className="text-pink-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={item.productName ?? ""}
                      placeholder="Pilih produk..."
                      readOnly
                      className={`rounded-xl border-pink-200/80 h-10 bg-gray-50/80 text-gray-800 ${
                        errors[`item_${idx}_product`] ? "border-rose-400" : ""
                      }`}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        setActiveItemId(item.id);
                        setOpenProductModal(true);
                      }}
                      className="rounded-xl px-3 h-10 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 shadow-none font-semibold text-xs"
                    >
                      Pilih
                    </Button>
                  </div>
                  {errors[`item_${idx}_product`] && (
                    <p className="text-rose-500 text-xs mt-0.5">{errors[`item_${idx}_product`]}</p>
                  )}
                </div>

                {/* PART NUMBER */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Part Number</Label>
                  <Input
                    value={item.partNumber ?? "-"}
                    readOnly
                    className="rounded-xl border-pink-100 h-10 bg-gray-50/80 text-gray-700 text-xs"
                  />
                </div>

                {/* QUANTITY */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Jumlah Masuk (Qty) <span className="text-pink-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemField(item.id, "quantity", Number(e.target.value))}
                    className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-10 bg-white/70 font-semibold ${
                      errors[`item_${idx}_quantity`] ? "border-rose-400" : ""
                    }`}
                  />
                  {errors[`item_${idx}_quantity`] && (
                    <p className="text-rose-500 text-xs mt-0.5">{errors[`item_${idx}_quantity`]}</p>
                  )}
                </div>

                {/* UNIT PRICE */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Harga Satuan ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItemField(item.id, "unitPrice", Number(e.target.value))}
                    className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-10 bg-white/70"
                  />
                </div>
              </div>

              {/* NOTES & SUBTOTAL */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="w-full sm:w-2/3">
                  <Input
                    value={item.notes ?? ""}
                    onChange={(e) => updateItemField(item.id, "notes", e.target.value)}
                    placeholder="Catatan batch / kondisi untuk item ini (opsional)..."
                    className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-9 bg-white/70 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto text-sm">
                  <span className="text-gray-500 text-xs">Subtotal Item:</span>
                  <span className="font-bold text-emerald-600 text-base">
                    ${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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

      <ProductSelectModal
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        onSelect={handleProductSelect}
      />
    </div>
  );
}
