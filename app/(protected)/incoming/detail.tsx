"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Plus,
  PackagePlus,
  Package,
  Layers,
  DollarSign,
  Calendar,
  Building2,
  Warehouse as WarehouseIcon,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { apiFetch } from "@/lib/api";

type APIItem = {
  id: number;
  productId: number;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  product?: { id: number; name?: string; partNumber?: string; stock?: number } | null;
};

type ItemRow = {
  id: string;
  productId: number | null;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice: number;
  stock?: number;
  notes?: string | null;
};

export default function IncomingDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const idParam = id;

  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // Header form state
  const [header, setHeader] = React.useState({
    transactionDate: new Date().toISOString().split("T")[0],
    supplierId: null as number | null,
    supplierName: "",
    warehouseId: null as number | null,
    warehouseName: "",
    notes: "",
    status: "Draft",
    createdByName: "",
    createdAt: "",
  });

  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Modals
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false);
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  // Fetch detail from backend
  const fetchDetail = React.useCallback(async () => {
    if (!idParam) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/incoming-transactions/${idParam}`, { method: "GET" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal memuat transaksi");
      }
      const data = json.data;

      setHeader({
        transactionDate: data.transactionDate ? data.transactionDate.split("T")[0] : "",
        supplierId: data.supplierId ?? data.supplier?.id ?? null,
        supplierName: data.supplier?.name ?? data.supplierName ?? "-",
        warehouseId: data.warehouseId ?? data.warehouse?.id ?? null,
        warehouseName: data.warehouse?.name ?? data.warehouseName ?? "-",
        notes: data.notes ?? "",
        status: data.status ?? "Draft",
        createdByName: data.createdBy?.name ?? "-",
        createdAt: data.createdAt ?? "",
      });

      const mappedItems: ItemRow[] = (data.items || []).map((it: any) => ({
        id: String(it.id || Date.now() + Math.random()),
        productId: it.productId ?? it.product?.id ?? null,
        productName: it.productName ?? it.product?.name ?? "-",
        partNumber: it.partNumber ?? it.product?.partNumber ?? "-",
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        stock: it.product?.stock ?? 0,
        notes: it.notes ?? "",
      }));

      setItems(mappedItems);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal memuat transaksi masuk");
      router.push("/incoming");
    } finally {
      setLoading(false);
    }
  }, [idParam, router]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Validation
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!header.transactionDate) errs.transactionDate = "Tanggal transaksi wajib diisi";
    if (!header.supplierId) errs.supplier = "Supplier wajib dipilih";
    if (!header.warehouseId) errs.warehouse = "Gudang wajib dipilih";

    items.forEach((it, idx) => {
      if (!it.productId) errs[`item_${idx}_product`] = "Pilih produk";
      if (!it.quantity || it.quantity <= 0) errs[`item_${idx}_quantity`] = "Jumlah minimal 1";
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Selectors callbacks
  const onSupplierSelect = (s: any) => {
    setHeader((prev) => ({ ...prev, supplierId: s.id, supplierName: s.name }));
  };

  const onWarehouseSelect = (w: any) => {
    setHeader((prev) => ({ ...prev, warehouseId: w.id, warehouseName: w.name }));
  };

  const onProductSelect = (p: any) => {
    if (!activeItemId) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === activeItemId
          ? {
              ...it,
              productId: p.id,
              productName: p.productName || p.name,
              partNumber: p.partNumber ?? "-",
              unitPrice: Number(p.unitPrice) || 0,
              stock: p.stock ?? 0,
            }
          : it
      )
    );
    setActiveItemId(null);
  };

  // Item helpers
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

  const removeItem = (rowId: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((it) => it.id !== rowId));
  };

  const updateItem = (rowId: string, field: keyof ItemRow, val: any) => {
    setItems((prev) => prev.map((it) => (it.id === rowId ? { ...it, [field]: val } : it)));
  };

  // Calculations
  const totals = React.useMemo(() => {
    const totalItems = items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const totalValue = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
    return { totalItems, totalValue };
  }, [items]);

  // Save changes
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        transactionDate: header.transactionDate,
        supplierId: header.supplierId,
        warehouseId: header.warehouseId,
        notes: header.notes,
        status: header.status,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
        })),
      };

      const res = await apiFetch(`/incoming-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal memperbarui transaksi");
      }

      alert("✅ Perubahan transaksi berhasil disimpan!");
      setIsEditing(false);
      fetchDetail();
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal menyimpan transaksi"}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit Done
  const handleSubmitDone = async () => {
    if (!validate()) return;
    if (!confirm("Selesaikan transaksi ini (status Done)? Stok gudang akan otomatis ditambahkan.")) return;

    setLoading(true);
    try {
      const payload = {
        transactionDate: header.transactionDate,
        supplierId: header.supplierId,
        warehouseId: header.warehouseId,
        notes: header.notes,
        status: "Done",
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
        })),
      };

      const res = await apiFetch(`/incoming-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal menyelesaikan transaksi");
      }

      alert("✅ Transaksi berhasil disubmit (Done)! Stok otomatis bertambah.");
      setIsEditing(false);
      fetchDetail();
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal submit transaksi"}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/incoming-transactions/${idParam}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal menghapus transaksi");
      }
      alert("🗑️ Transaksi masuk berhasil dihapus.");
      router.push("/incoming");
    } catch (err: any) {
      alert(`❌ Gagal menghapus: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const isDone = header.status === "Done";
  const canEdit = isEditing && !isDone;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/incoming")}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 shadow-xs transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Dokumen #{idParam}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700">
                <PackagePlus className="w-3 h-3 text-emerald-500" /> Penerimaan Stok
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Rincian penerimaan barang masuk dari pemasok ke fasilitas gudang
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {!isEditing ? (
            <>
              {!isDone && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Transaksi
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  fetchDetail();
                }}
                className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-sm"
              >
                Batal
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan Draft"}
              </Button>

              <Button
                onClick={handleSubmitDone}
                disabled={loading}
                className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Memproses..." : "Selesai (Done)"}
              </Button>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={deleting}
                className="rounded-full px-4 text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-none"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border border-pink-200/80 rounded-2xl shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 font-bold">Hapus Transaksi Penerimaan Ini?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-sm">
                  Tindakan ini tidak dapat dibatalkan. {isDone ? "Stok barang di gudang akan otomatis di-rollback (dikurangkan kembali)." : "Dokumen draft ini akan dihapus permanen."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-full text-sm">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-rose-500 hover:bg-rose-600 text-white rounded-full text-sm border-0 shadow-sm"
                >
                  Hapus Permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status Transaksi</span>
            <div className="p-2.5 rounded-xl bg-pink-100/70 text-pink-600">
              <PackagePlus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <Badge
              className={
                isDone
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-sm px-3 py-1"
                  : "bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-sm px-3 py-1"
              }
            >
              {isDone ? "SELESAI (DONE)" : "DRAFT"}
            </Badge>
          </div>
          <p className="text-xs text-pink-600 font-medium mt-2">
            {isDone ? "Stok telah dialokasikan ke gudang" : "Menunggu verifikasi fisik"}
          </p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Quantity Masuk</span>
            <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{totals.totalItems} Unit</div>
          <p className="text-xs text-blue-700 font-medium mt-1">Akumulasi seluruh baris barang</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Nilai Pembelian</span>
            <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">
            ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1">Kalkulasi Qty × Unit Price</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tanggal Masuk</span>
            <div className="p-2.5 rounded-xl bg-purple-100/70 text-purple-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {formatDate(header.transactionDate)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Petugas: {header.createdByName}</p>
        </div>
      </div>

      {/* Transaction Information Form */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Informasi Dokumen Penerimaan</h2>
              <p className="text-xs text-gray-500">Vendor pemasok, fasilitas gudang penampung, dan nomor faktur</p>
            </div>
          </div>
          {isEditing && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Mode Edit Aktif
            </span>
          )}
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* DATE */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Tanggal Transaksi <span className="text-pink-500">*</span>
              </Label>
              <Input
                type="date"
                value={header.transactionDate}
                onChange={(e) => setHeader((h) => ({ ...h, transactionDate: e.target.value }))}
                className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                disabled={!canEdit}
              />
            </div>

            {/* SUPPLIER */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Pemasok (Supplier) <span className="text-pink-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={header.supplierName}
                  readOnly
                  className="rounded-xl border-pink-100 h-11 bg-gray-50/80 text-gray-700"
                />
                {canEdit && (
                  <Button
                    type="button"
                    onClick={() => setOpenSupplierModal(true)}
                    className="rounded-xl px-4 h-11 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 shadow-none font-semibold text-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1" /> Pilih
                  </Button>
                )}
              </div>
            </div>

            {/* WAREHOUSE */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Gudang Tujuan <span className="text-pink-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={header.warehouseName}
                  readOnly
                  className="rounded-xl border-pink-100 h-11 bg-gray-50/80 text-gray-700"
                />
                {canEdit && (
                  <Button
                    type="button"
                    onClick={() => setOpenWarehouseModal(true)}
                    className="rounded-xl px-4 h-11 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 shadow-none font-semibold text-xs"
                  >
                    <WarehouseIcon className="w-3.5 h-3.5 mr-1" /> Pilih
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="grid gap-2 mt-4">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Catatan Penerimaan</Label>
            <Textarea
              value={header.notes}
              onChange={(e) => setHeader((h) => ({ ...h, notes: e.target.value }))}
              rows={2}
              placeholder="Catatan surat jalan atau kondisi pengiriman dari vendor..."
              className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* PRODUCT ITEMS LIST */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Rincian Barang Masuk</h2>
              <p className="text-xs text-gray-500">Kuantitas volume penerimaan fisik dan harga perolehan satuan</p>
            </div>
          </div>
          {canEdit && (
            <Button
              type="button"
              onClick={addItem}
              className="btn-gradient border-0 rounded-full px-4 h-9 shadow-xs text-xs font-semibold"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Baris Produk
            </Button>
          )}
        </div>

        <div className="p-6 space-y-4">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="p-5 rounded-2xl bg-white/70 border border-pink-100/80 shadow-xs space-y-4 hover:border-pink-200 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-pink-100/50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {it.productName || "Pilih Produk..."}
                  </span>
                </div>
                {canEdit && items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(it.id)}
                    className="text-rose-600 hover:bg-rose-50 rounded-full h-8 px-2.5 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus Baris
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Product Selector */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Produk</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={it.productName ?? ""}
                      readOnly
                      className="rounded-xl border-pink-100 h-10 bg-gray-50/80 text-gray-800 text-xs"
                    />
                    {canEdit && (
                      <Button
                        type="button"
                        onClick={() => {
                          setActiveItemId(it.id);
                          setOpenProductModal(true);
                        }}
                        className="rounded-xl px-3 h-10 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 shadow-none font-semibold text-xs"
                      >
                        Pilih
                      </Button>
                    )}
                  </div>
                </div>

                {/* Part Number */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Part Number</Label>
                  <Input
                    value={it.partNumber ?? "-"}
                    readOnly
                    className="rounded-xl border-pink-100 h-10 bg-gray-50/80 text-gray-500 font-mono text-xs"
                  />
                </div>

                {/* Quantity */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Jumlah Masuk (Qty)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) => updateItem(it.id, "quantity", Number(e.target.value || 0))}
                    disabled={!canEdit}
                    className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-10 bg-white/70 font-semibold"
                  />
                </div>

                {/* Unit Price */}
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Harga Satuan ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={it.unitPrice}
                    onChange={(e) => updateItem(it.id, "unitPrice", Number(e.target.value || 0))}
                    disabled={!canEdit}
                    className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-10 bg-white/70"
                  />
                </div>
              </div>

              {/* Notes & Subtotal */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="w-full sm:w-2/3">
                  <Input
                    value={it.notes ?? ""}
                    onChange={(e) => updateItem(it.id, "notes", e.target.value)}
                    disabled={!canEdit}
                    placeholder="Catatan batch / kondisi produk (opsional)..."
                    className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-9 bg-white/70 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto text-sm">
                  <span className="text-gray-500 text-xs">Subtotal Baris:</span>
                  <span className="font-bold text-emerald-600 text-base">
                    ${((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selectors Modals */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={onSupplierSelect}
      />
      <WarehouseSelectModal
        open={openWarehouseModal}
        onClose={() => setOpenWarehouseModal(false)}
        onSelect={onWarehouseSelect}
      />
      <ProductSelectModal
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        onSelect={onProductSelect}
      />
    </div>
  );
}
