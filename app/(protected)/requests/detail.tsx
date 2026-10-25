"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ClipboardList,
  Clock,
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

import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

type Status = "Pending" | "Partial" | "Fulfilled";

interface ApiItem {
  id: number;
  productName: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ApiDetail {
  id: number;
  requestDate: string;
  fulfilledDate: string | null;
  store: string;
  supplier: string | null;
  notes: string | null;
  status: Status;
  items: ApiItem[];
}

interface Item {
  id: number;
  product_name: string;
  requested_quantity: number;
  fulfilled_quantity: number;
  unit_price: number;
}

interface RequestDetail {
  id: string;
  requestDate: string;
  fulfilledDate: string | null;
  store: string;
  supplier: string | null;
  notes: string | null;
  status: Status;
  items: Item[];
}

export default function ProductRequestDetailPage({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [request, setRequest] = React.useState<RequestDetail | null>(null);

  /* ================= LOAD ================= */
  const loadDetail = React.useCallback(async () => {
    try {
      const res = await apiFetch(`/product-requests/${id}`, { method: "GET" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      const d: ApiDetail = json.data;

      setRequest({
        id: String(d.id),
        requestDate: d.requestDate,
        fulfilledDate: d.fulfilledDate,
        store: d.store,
        supplier: d.supplier,
        notes: d.notes,
        status: d.status,
        items: d.items.map((i) => ({
          id: i.id,
          product_name: i.productName,
          requested_quantity: i.requestedQuantity,
          fulfilled_quantity: i.fulfilledQuantity,
          unit_price: i.unitPrice,
        })),
      });
    } catch (e) {
      console.error(e);
      alert("Gagal memuat detail permintaan barang.");
    }
  }, [id]);

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  if (!request) return null;

  /* ================= TOTALS ================= */
  const totalRequestedQty = request.items.reduce(
    (s, i) => s + i.requested_quantity,
    0
  );

  const totalFulfilledQty = request.items.reduce(
    (s, i) => s + i.fulfilled_quantity,
    0
  );

  const totalPrice = request.items.reduce(
    (s, i) => s + i.fulfilled_quantity * i.unit_price,
    0
  );

  const computedStatus: Status =
    totalFulfilledQty === 0
      ? "Pending"
      : totalFulfilledQty < totalRequestedQty
      ? "Partial"
      : "Fulfilled";

  /* ================= UPDATE ITEM ================= */
  const updateItem = (
    itemId: number,
    field: keyof Item,
    value: number | string
  ) => {
    setRequest((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((i) =>
              i.id === itemId ? { ...i, [field]: value } : i
            ),
          }
        : prev
    );
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    setLoading(true);

    try {
      const payload = {
        requestDate: request.requestDate,
        fulfilledDate: request.fulfilledDate,
        store: request.store,
        supplier: request.supplier,
        notes: request.notes,
        status: computedStatus,
        items: request.items.map((i) => ({
          id: i.id,
          product_name: i.product_name,
          requested_quantity: i.requested_quantity,
          fulfilled_quantity: i.fulfilled_quantity,
          unit_price: i.unit_price,
          total_price: i.fulfilled_quantity * i.unit_price,
        })),
      };

      const res = await apiFetch(`/product-requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error);

      alert("✅ Perubahan permintaan berhasil disimpan!");
      setEditing(false);
      loadDetail();
    } catch (e: any) {
      console.error(e);
      alert(`❌ Error: ${e.message || "Gagal memperbarui permintaan"}`);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    try {
      await apiFetch(`/product-requests/${id}`, { method: "DELETE" });
      alert("✅ Permintaan berhasil dihapus!");
      router.push("/requests");
    } catch {
      alert("❌ Gagal menghapus permintaan barang");
    }
  };

  /* ================= FULFILL ALL ================= */
  const handleFulfillAll = () => {
    setRequest((prev) =>
      prev
        ? {
            ...prev,
            fulfilledDate: new Date().toISOString().split("T")[0],
            items: prev.items.map((i) => ({
              ...i,
              fulfilled_quantity: i.requested_quantity,
            })),
          }
        : prev
    );
    setEditing(true);
  };

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/requests")}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 text-pink-600 transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                Permintaan #{String(request.id).padStart(4, "0")}
              </h1>
              {computedStatus === "Fulfilled" ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                  TERPENUHI (FULFILLED)
                </Badge>
              ) : computedStatus === "Partial" ? (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                  SEBAGIAN (PARTIAL)
                </Badge>
              ) : (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                  PENDING
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Rincian item permintaan dan pemenuhan alokasi stok toko cabang
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap gap-y-2">
          {computedStatus !== "Fulfilled" && (
            <Button
              onClick={handleFulfillAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 text-xs font-semibold shadow-md border-0"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Penuhi Semua
            </Button>
          )}

          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              className="btn-gradient rounded-full px-4 text-xs font-semibold shadow-md border-0"
            >
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  loadDetail();
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
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-full px-3.5 text-xs font-semibold shadow-none"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border-pink-200 rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900">
                  Hapus Permintaan Barang?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-xs sm:text-sm">
                  Tindakan ini permanen dan akan menghapus data permohonan dari sistem.
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
                  Ya, Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              Nilai Realisasi
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
              Status Permintaan
            </div>
            <div className="mt-1">
              <span className="text-xs font-bold text-gray-800">
                {computedStatus === "Fulfilled"
                  ? "Selesai Dipenuhi"
                  : computedStatus === "Partial"
                  ? "Dipenuhi Sebagian"
                  : "Menunggu Pemenuhan"}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100/70 flex items-center justify-center text-purple-600">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* REQUEST INFO */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
          <Building2 className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            Informasi Dokumen Pengajuan
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {/* TANGGAL REQUEST */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Tanggal Permintaan
            </Label>
            <Input
              type="date"
              value={request.requestDate}
              onChange={(e) =>
                setRequest({ ...request, requestDate: e.target.value })
              }
              disabled={!editing}
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>

          {/* TANGGAL FULFILLED */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Tanggal Realisasi Pemenuhan
            </Label>
            <Input
              type="date"
              value={request.fulfilledDate ?? ""}
              onChange={(e) =>
                setRequest({ ...request, fulfilledDate: e.target.value })
              }
              disabled={!editing}
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>

          {/* STORE */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Toko / Unit Cabang Peminta
            </Label>
            <Input
              value={request.store}
              onChange={(e) =>
                setRequest({ ...request, store: e.target.value })
              }
              disabled={!editing}
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>

          {/* SUPPLIER */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Vendor / Supplier Rekomendasi
            </Label>
            <Input
              value={request.supplier ?? ""}
              onChange={(e) =>
                setRequest({ ...request, supplier: e.target.value })
              }
              disabled={!editing}
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-semibold text-gray-700">
              Keterangan & Catatan Kebutuhan
            </Label>
            <Textarea
              value={request.notes ?? ""}
              onChange={(e) =>
                setRequest({ ...request, notes: e.target.value })
              }
              rows={2}
              disabled={!editing}
              className="bg-white/80 rounded-xl text-xs sm:text-sm border-pink-200/80"
            />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="enhanced-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-pink-100/60">
          <Package className="w-4 h-4 text-pink-500" />
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            Daftar Barang yang Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {request.items.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 sm:p-4 rounded-2xl bg-white/70 border border-pink-200/70 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between pb-1 border-b border-pink-50">
                <span className="font-bold text-xs text-pink-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  Barang #{idx + 1}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
                {/* Product Name */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Nama Barang
                  </Label>
                  <Input
                    value={item.product_name}
                    disabled
                    className="bg-gray-50/80 rounded-xl text-xs h-9 text-gray-600 border-pink-100"
                  />
                </div>

                {/* Requested Qty */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-600">
                    Jumlah Diminta
                  </Label>
                  <Input
                    type="number"
                    value={item.requested_quantity}
                    disabled
                    className="bg-gray-50/80 rounded-xl text-xs h-9 text-gray-600 border-pink-100 font-semibold"
                  />
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
                        parseInt(e.target.value) || 0
                      )
                    }
                    disabled={!editing}
                    className="bg-white rounded-xl text-xs h-9 border-pink-200/80 font-bold text-emerald-700"
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
                        parseFloat(e.target.value) || 0
                      )
                    }
                    disabled={!editing}
                    className="bg-white rounded-xl text-xs h-9 border-pink-200/80"
                  />
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex justify-end pt-1 border-t border-pink-50/70 text-xs text-gray-600 font-medium">
                Subtotal Nilai Terpenuhi:{" "}
                <span className="font-bold text-rose-600 ml-1.5">
                  {formatRupiah(item.fulfilled_quantity * item.unit_price)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
