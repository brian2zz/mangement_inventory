"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Plus,
  X,
  Calendar,
  Building2,
  Warehouse as WarehouseIcon,
  Layers,
  Sparkles,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Package,
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

import WarehouseSelectModal from "@/components/selectors/WarehouseSelectModal";
import CustomerSelectModal from "@/components/selectors/CustomerSelectModal";
import ProductSelectModal from "@/components/selectors/ProductSelectModal";
import { apiFetch } from "@/lib/api";

type APIItem = {
  id: number;
  productId?: number;
  product_id?: number;
  productName?: string | null;
  partNumber?: string | null;
  quantity: number;
  unitPrice?: number;
  unit_price?: number;
  totalPrice?: number;
  total_price?: number;
  notes?: string | null;
  product?: {
    id: number;
    name?: string;
    part_number?: string;
    unit_price?: number;
    stock?: number;
  } | null;
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

export default function OutgoingEditPage({ id }: { id: string }) {
  const router = useRouter();
  const idParam = id;

  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  // HEADER STATE
  const [header, setHeader] = React.useState({
    transaction_date: new Date().toISOString().split("T")[0],
    warehouseId: null as number | null,
    warehouseName: "",
    customerId: null as number | null,
    customerName: "",
    notes: "",
    status: "Draft",
    createdByName: "-",
    createdAt: "",
  });

  // ITEMS
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // MODALS
  const [openWarehouseModal, setOpenWarehouseModal] = React.useState(false);
  const [openCustomerModal, setOpenCustomerModal] = React.useState(false);
  const [openProductModal, setOpenProductModal] = React.useState(false);
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);

  // ================== FETCH DETAIL ==================
  const fetchDetail = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/outgoing-transactions/${idParam}`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Gagal memuat detail transaksi keluar");

      const json = await res.json();
      const trx = json.data;

      // Map header
      const rawDate = trx.transaction_date || trx.transactionDate || "";
      let formattedDate = "";
      if (rawDate) {
        formattedDate = rawDate.split("T")[0];
      }

      setHeader({
        transaction_date: formattedDate,
        warehouseId: trx.warehouse_id ?? trx.warehouseId ?? trx.warehouse?.id ?? null,
        warehouseName: trx.warehouse?.name ?? "-",
        customerId: trx.customer_id ?? trx.customerId ?? trx.customer?.id ?? null,
        customerName: trx.customer?.name ?? "-",
        notes: trx.notes ?? "",
        status: trx.status ?? "Draft",
        createdByName: trx.createdBy?.name ?? trx.created_by?.name ?? "Admin",
        createdAt: trx.created_at || trx.createdAt || "",
      });

      // Map items
      const rawItems: APIItem[] = trx.items || [];
      const mapped: ItemRow[] = rawItems.map((it) => ({
        id: String(it.id || Date.now() + Math.random()),
        productId: it.productId ?? it.product_id ?? it.product?.id ?? null,
        productName: it.productName ?? it.product?.name ?? "-",
        partNumber: it.partNumber ?? it.product?.part_number ?? "-",
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice ?? it.unit_price ?? it.product?.unit_price ?? 0),
        stock: it.product?.stock,
        notes: it.notes ?? "",
      }));

      setItems(
        mapped.length
          ? mapped
          : [
              {
                id: Date.now().toString(),
                productId: null,
                productName: null,
                partNumber: null,
                quantity: 1,
                unitPrice: 0,
                notes: "",
              },
            ]
      );
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data transaksi keluar.");
    } finally {
      setLoading(false);
    }
  }, [idParam]);

  React.useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // ================== HELPERS ==================
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        productId: null,
        productName: null,
        partNumber: null,
        quantity: 1,
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
  const onWarehouseSelect = (w: { id: number; name: string }) => {
    setHeader((h) => ({ ...h, warehouseId: w.id, warehouseName: w.name }));
    setOpenWarehouseModal(false);
  };

  const onCustomerSelect = (c: { id: number; name: string }) => {
    setHeader((h) => ({ ...h, customerId: c.id, customerName: c.name }));
    setOpenCustomerModal(false);
  };

  const onProductSelect = (p: {
    id: number;
    productName: string;
    partNumber?: string | null;
    unitPrice?: number;
    stock?: number;
  }) => {
    if (!activeItemId) return;
    updateItem(activeItemId, "productId", p.id);
    updateItem(activeItemId, "productName", p.productName ?? null);
    updateItem(activeItemId, "partNumber", p.partNumber ?? null);
    updateItem(activeItemId, "unitPrice", Number(p.unitPrice ?? 0));
    updateItem(activeItemId, "stock", p.stock);
    setActiveItemId(null);
    setOpenProductModal(false);
  };

  // ================== VALIDATION ==================
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!header.transaction_date) errs.transaction_date = "Tanggal wajib diisi";
    if (!header.warehouseId) errs.warehouse = "Gudang asal wajib dipilih";
    if (!header.customerId) errs.customer = "Customer penerima wajib dipilih";

    if (header.status === "Draft") {
      items.forEach((it, idx) => {
        if (!it.productId) errs[`item_${idx}_product`] = "Pilih produk";
        if (!it.quantity || it.quantity <= 0)
          errs[`item_${idx}_quantity`] = "Jumlah minimal 1";
      });
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ================== TOTALS ==================
  const totals = React.useMemo(() => {
    const totalItems = items.reduce(
      (s, it) => s + Number(it.quantity || 0),
      0
    );
    const totalValue = items.reduce(
      (s, it) => s + Number(it.quantity || 0) * Number(it.unitPrice || 0),
      0
    );
    return { totalItems, totalValue };
  }, [items]);

  // ================== SAVE DRAFT ==================
  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    if (!validate()) {
      alert("Periksa kembali inputan form yang ditandai merah.");
      return;
    }

    setLoading(true);
    try {
      let payload: any = {};

      if (header.status === "Done") {
        payload.transaction_date = header.transaction_date;
        payload.notes = header.notes;
        payload.status = header.status;
      } else {
        payload = {
          warehouseId: header.warehouseId,
          customerId: header.customerId,
          transaction_date: header.transaction_date,
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

      const res = await apiFetch(`/outgoing-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal memperbarui transaksi keluar");
      }

      alert("✅ Perubahan transaksi keluar berhasil disimpan!");
      setIsEditing(false);
      fetchDetail();
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal menyimpan perubahan"}`);
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
      alert("Hanya transaksi status DRAFT yang dapat diselesaikan.");
      return;
    }

    if (!validate()) {
      alert("Periksa validasi sebelum menyelesaikan transaksi.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status: "Done",
        warehouseId: header.warehouseId,
        customerId: header.customerId,
        transaction_date: header.transaction_date,
        notes: header.notes,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          notes: it.notes,
        })),
      };

      const res = await apiFetch(`/outgoing-transactions/${idParam}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal menyelesaikan transaksi");
      }

      alert("✅ Transaksi keluar berhasil diselesaikan (DONE) dan stok terpotong!");
      setIsEditing(false);
      fetchDetail();
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal submit transaksi"}`);
    } finally {
      setLoading(false);
    }
  };

  // ================== DELETE ==================
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/outgoing-transactions/${idParam}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Gagal menghapus transaksi keluar");
      }
      alert("✅ Transaksi keluar berhasil dihapus!");
      router.push("/outgoing");
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal menghapus"}`);
    } finally {
      setDeleting(false);
    }
  };

  const isDone = header.status === "Done";
  const canEditHeader = isEditing;
  const canEditItems = isEditing && !isDone;

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-6xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/outgoing")}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 text-pink-600 transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Transaksi Keluar #OUT-{String(idParam).padStart(4, "0")}
              </h1>
              <Badge
                className={
                  isDone
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5"
                    : "bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-xs px-2.5 py-0.5"
                }
              >
                {isDone ? "SELESAI (DONE)" : "DRAFT"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Detail transaksi pengeluaran barang dan riwayat alokasi stok gudang
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap gap-y-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="btn-gradient rounded-full px-4 text-xs font-semibold shadow-md border-0"
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit Transaksi
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  fetchDetail();
                }}
                className="bg-white/80 rounded-full border-pink-200 text-gray-600 text-xs px-4"
              >
                Batal
              </Button>

              <Button
                onClick={handleSave}
                disabled={loading}
                size="sm"
                className="btn-gradient rounded-full px-4 text-xs font-semibold shadow-md border-0"
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>

              {!isDone && (
                <Button
                  onClick={handleSubmitDone}
                  disabled={loading}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 text-xs font-semibold shadow-md border-0"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {loading ? "Memproses..." : "Selesaikan (Done)"}
                </Button>
              )}
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
                className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-full px-3.5 text-xs font-semibold shadow-none"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border-pink-200 rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">
                  Konfirmasi Hapus Transaksi?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-xs sm:text-sm">
                  Menghapus transaksi ini{" "}
                  {isDone ? "akan membatalkan (rollback) pengurangan stok gudang dan " : ""}
                  menghapus data secara permanen dari basis data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full text-xs">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold"
                >
                  Ya, Hapus Transaksi
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Unit
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-pink-600 mt-1">
              {totals.totalItems} Unit
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-100/70 flex items-center justify-center text-pink-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Nilai Barang
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
              Rp {totals.totalValue.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status Stok
            </div>
            <div className="mt-1">
              <span className="text-xs font-bold text-gray-800">
                {isDone ? "Stok Berkurang (Locked)" : "Draft (Pending Cut)"}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100/70 flex items-center justify-center text-purple-600">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="enhanced-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tanggal Transaksi
            </div>
            <div className="text-sm sm:text-base font-bold text-gray-800 mt-1">
              {header.transaction_date || "-"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-100/70 flex items-center justify-center text-pink-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* HEADER FORM */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
          <Building2 className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            Informasi Dokumen Pengeluaran
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* TANGGAL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Tanggal Keluar {isEditing && <span className="text-rose-500">*</span>}
            </Label>
            <Input
              type="date"
              value={header.transaction_date}
              onChange={(e) =>
                setHeader((h) => ({
                  ...h,
                  transaction_date: e.target.value,
                }))
              }
              className={`bg-white/80 rounded-xl text-xs sm:text-sm ${
                errors.transaction_date ? "border-red-500" : "border-pink-200/80"
              }`}
              disabled={!canEditHeader}
            />
            {errors.transaction_date && (
              <p className="text-red-500 text-xs">{errors.transaction_date}</p>
            )}
          </div>

          {/* CUSTOMER */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Customer / Penerima{" "}
              {isEditing && header.status === "Draft" && (
                <span className="text-rose-500">*</span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={header.customerName}
                readOnly
                className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
              />
              <Button
                type="button"
                onClick={() => setOpenCustomerModal(true)}
                disabled={!isEditing || header.status !== "Draft"}
                className="btn-gradient rounded-xl px-4 text-xs font-medium shrink-0 border-0 disabled:opacity-50"
              >
                Pilih
              </Button>
            </div>
            {errors.customer && (
              <p className="text-red-500 text-xs">{errors.customer}</p>
            )}
          </div>

          {/* GUDANG ASAL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Gudang Asal{" "}
              {isEditing && header.status === "Draft" && (
                <span className="text-rose-500">*</span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={header.warehouseName}
                readOnly
                className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
              />
              <Button
                type="button"
                onClick={() => setOpenWarehouseModal(true)}
                disabled={!isEditing || header.status !== "Draft"}
                className="btn-gradient rounded-xl px-4 text-xs font-medium shrink-0 border-0 disabled:opacity-50"
              >
                Pilih
              </Button>
            </div>
            {errors.warehouse && (
              <p className="text-red-500 text-xs">{errors.warehouse}</p>
            )}
          </div>

          {/* CATATAN */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Catatan / Info Pengiriman
            </Label>
            <Textarea
              value={header.notes}
              onChange={(e) =>
                setHeader((h) => ({ ...h, notes: e.target.value }))
              }
              rows={2}
              placeholder="Tambahkan catatan keterangan..."
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
              disabled={!canEditHeader}
            />
          </div>
        </div>
      </div>

      {/* ITEMS DAFTAR BARANG */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/60">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-pink-500" />
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              Rincian Barang yang Dikeluarkan
            </h2>
          </div>
          {canEditItems && (
            <Button
              type="button"
              onClick={addItem}
              size="sm"
              className="rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 text-xs font-semibold px-3"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tambah Baris Produk
            </Button>
          )}
        </div>

        {isDone && (
          <div className="p-3 bg-pink-50/60 border border-pink-200/80 rounded-xl flex items-center gap-2 text-xs text-pink-800">
            <AlertTriangle className="w-4 h-4 text-pink-600 shrink-0" />
            <span>
              Transaksi sudah berstatus <strong>SELESAI (DONE)</strong>. Daftar barang dan kuantitas dikunci untuk menjaga integritas stok riil di gudang.
            </span>
          </div>
        )}

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div
              key={it.id}
              className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-pink-200/70 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between pb-1 border-b border-pink-50">
                <span className="font-bold text-xs text-pink-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  Barang #{idx + 1}
                </span>
                {canEditItems && items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(it.id)}
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
                    Produk {canEditItems && <span className="text-rose-500">*</span>}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={it.productName ?? ""}
                      readOnly
                      placeholder="Pilih produk..."
                      className={`bg-white rounded-xl text-xs h-9 ${
                        errors[`item_${idx}_product`]
                          ? "border-red-500"
                          : "border-pink-200/80"
                      }`}
                    />
                    {canEditItems && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setActiveItemId(it.id);
                          setOpenProductModal(true);
                        }}
                        className="btn-gradient rounded-xl px-3 h-9 text-xs shrink-0 border-0"
                      >
                        Pilih
                      </Button>
                    )}
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
                    value={it.partNumber ?? "-"}
                    readOnly
                    className="bg-gray-50/80 rounded-xl text-xs h-9 text-gray-500 border-pink-100"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-600">
                      Jumlah {canEditItems && <span className="text-rose-500">*</span>}
                    </Label>
                    {it.stock !== undefined && (
                      <span className="text-[10px] text-gray-400 font-semibold">
                        Stok: {it.stock}
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) => {
                      if (canEditItems) {
                        updateItem(
                          it.id,
                          "quantity",
                          parseInt(e.target.value) || 0
                        );
                      }
                    }}
                    disabled={!canEditItems}
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
                    value={it.unitPrice}
                    onChange={(e) => {
                      if (canEditItems) {
                        updateItem(
                          it.id,
                          "unitPrice",
                          parseFloat(e.target.value) || 0
                        );
                      }
                    }}
                    disabled={!canEditItems}
                    className="bg-white rounded-xl text-xs h-9 border-pink-200/80"
                  />
                </div>
              </div>

              {/* Catatan Item & Subtotal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-pink-50/70">
                <div className="flex-1 max-w-md">
                  <Input
                    placeholder="Catatan khusus baris produk..."
                    value={it.notes ?? ""}
                    onChange={(e) => {
                      if (canEditItems) {
                        updateItem(it.id, "notes", e.target.value);
                      }
                    }}
                    disabled={!canEditItems}
                    className="bg-white/60 rounded-lg text-xs h-8 border-pink-100"
                  />
                </div>
                <div className="text-xs text-gray-600 font-medium self-end sm:self-auto">
                  Subtotal:{" "}
                  <span className="font-bold text-rose-600">
                    Rp {((it.quantity || 0) * (it.unitPrice || 0)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
