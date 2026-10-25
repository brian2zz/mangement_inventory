"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, SlidersHorizontal, Sparkles, Package, TrendingUp, TrendingDown, HelpCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import ProductSelectModal from "@/components/selectors/ProductSelectModal"
import { apiFetch } from "@/lib/api"

/* ======================================================
   TYPES
====================================================== */
interface Product {
  id: number
  productName: string
  stock: number
}

/* ======================================================
   PAGE
====================================================== */
export default function AddInventoryAdjustmentPage() {
  const router = useRouter()
  const [openProductModal, setOpenProductModal] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const [form, setForm] = React.useState({
    productId: null as number | null,
    productName: "",
    currentStock: 0,
    newStock: "",
    adjustmentType: "" as "Increase" | "Decrease" | "",
    quantity: 0,
    notes: "",
  })

  /* ======================================================
     AUTO DETECT IN / OUT
  ====================================================== */
  React.useEffect(() => {
    if (!form.productId) return
    if (form.newStock === "") {
      setForm((f) => ({ ...f, adjustmentType: "", quantity: 0 }))
      return
    }

    const newStock = Number(form.newStock)
    const oldStock = form.currentStock

    if (newStock === oldStock) {
      setForm((f) => ({ ...f, adjustmentType: "", quantity: 0 }))
      return
    }

    if (newStock > oldStock) {
      setForm((f) => ({
        ...f,
        adjustmentType: "Increase",
        quantity: newStock - oldStock,
      }))
    } else {
      setForm((f) => ({
        ...f,
        adjustmentType: "Decrease",
        quantity: oldStock - newStock,
      }))
    }
  }, [form.newStock, form.productId, form.currentStock])

  /* ======================================================
     SUBMIT
  ====================================================== */
  const submit = async () => {
    if (!form.productId) return alert("Pilih produk terlebih dahulu")
    if (form.newStock === "") return alert("Stok baru wajib diisi")
    if (Number(form.newStock) < 0) return alert("Stok tidak boleh bernilai negatif")
    if (form.quantity === 0) return alert("Stok baru sama dengan stok lama (tidak ada perubahan)")
    if (!form.notes.trim()) return alert("Alasan penyesuaian stok wajib diisi")

    setIsLoading(true)

    try {
      const res = await apiFetch("/inventory-adjustments", {
        method: "POST",
        body: JSON.stringify({
          productId: form.productId,
          newStock: Number(form.newStock),
          notes: form.notes,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan adjustment")
      }

      alert("Penyesuaian stok berhasil disimpan!")
      router.push("/adjustment")
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Gagal menyimpan inventory adjustment")
    } finally {
      setIsLoading(false)
    }
  }

  /* ======================================================
     RENDER
  ====================================================== */
  const isIncrease = form.adjustmentType === "Increase"
  const isDecrease = form.adjustmentType === "Decrease"

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full w-9 h-9 bg-white/90 hover:bg-pink-50 border border-pink-200/80 shadow-xs hover:border-pink-300 text-pink-600 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                New Stock Adjustment
              </h1>
              <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Sesuaikan jumlah fisik stok barang gudang dengan pencatatan sistem.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-full px-5 py-2 text-xs sm:text-sm font-medium bg-white/90 hover:bg-slate-100 text-slate-600 border border-slate-200"
          >
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={isLoading}
            className="btn-gradient border-0 px-6 py-2 text-xs sm:text-sm"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Penyesuaian"}
          </Button>
        </div>
      </div>

      {/* FORM CARD */}
      <Card className="enhanced-card border border-pink-100/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 via-rose-50/30 to-transparent border-b border-pink-100/50 p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
                Data Penyesuaian Stok
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Pilih produk yang akan disesuaikan, lalu masukkan jumlah stok aktual terbaru.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* PRODUCT SELECTOR */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Pilih Produk <span className="text-rose-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={form.productName}
                readOnly
                placeholder="Klik tombol cari untuk memilih produk..."
                onClick={() => setOpenProductModal(true)}
                className="rounded-xl bg-white/90 border-slate-200 text-slate-700 cursor-pointer focus:ring-pink-200"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenProductModal(true)}
                className="rounded-xl bg-white/90 hover:bg-pink-50/70 border border-pink-200/80 text-pink-600 hover:text-pink-700 font-medium px-4 shrink-0"
              >
                <Package className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                Cari Produk
              </Button>
            </div>
          </div>

          {/* STOCK COMPARISON CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* STOK LAMA */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Stok Saat Ini (Sistem)
              </Label>
              <div className="text-2xl font-bold font-mono text-slate-700">
                {form.productId ? form.currentStock : "—"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Kuantitas yang saat ini tercatat di database
              </p>
            </div>

            {/* STOK BARU */}
            <div className="p-4 rounded-2xl bg-pink-50/40 border border-pink-200/80">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1 block">
                Stok Baru (Hasil Fisik) <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="Masukkan stok riil fisik..."
                value={form.newStock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, newStock: e.target.value }))
                }
                disabled={!form.productId}
                className="rounded-xl bg-white border-pink-200 focus:border-pink-400 focus:ring-pink-200 text-base font-semibold text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Jumlah barang yang benar-benar ada di gudang
              </p>
            </div>
          </div>

          {/* AUTO CALCULATION RESULT PILL */}
          {form.adjustmentType && (
            <div
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                isIncrease
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                  : "bg-rose-50/70 border-rose-200 text-rose-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isIncrease ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {isIncrease ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider block">
                    Kalkulasi Penyesuaian
                  </span>
                  <span className="text-xs opacity-80">
                    {isIncrease
                      ? "Stok sistem akan ditambahkan otomatis"
                      : "Stok sistem akan dikurangi otomatis"}
                  </span>
                </div>
              </div>

              <div
                className={`text-base sm:text-lg font-extrabold px-3.5 py-1 rounded-full ${
                  isIncrease
                    ? "bg-emerald-200/60 text-emerald-800 border border-emerald-300"
                    : "bg-rose-200/60 text-rose-800 border border-rose-300"
                }`}
              >
                {isIncrease ? `+${form.quantity}` : `-${form.quantity}`}
              </div>
            </div>
          )}

          {/* REASON / NOTES */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Alasan Penyesuaian <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              rows={3}
              placeholder="Contoh: Stok opname bulanan, barang rusak saat handling, selisih perhitungan awal..."
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* PRODUCT SELECTOR MODAL */}
      <ProductSelectModal
        open={openProductModal}
        onClose={() => setOpenProductModal(false)}
        onSelect={(p: Product) => {
          setForm((f) => ({
            ...f,
            productId: p.id,
            productName: p.productName,
            currentStock: p.stock,
            newStock: "",
            adjustmentType: "",
            quantity: 0,
          }))
          setOpenProductModal(false)
        }}
      />
    </div>
  )
}
