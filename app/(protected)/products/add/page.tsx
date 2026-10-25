"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, Package, Layers, DollarSign, Building } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal";
import { apiFetch } from "@/lib/api";

/* ======================================================
   TYPES
====================================================== */
interface Category {
  id: number;
  categoryName: string;
}

interface Supplier {
  id: number;
  name: string;
}

/* ======================================================
   PAGE
====================================================== */
export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false);

  const [form, setForm] = React.useState({
    cardNumber: "",
    productName: "",
    partNumber: "",
    description: "",
    categoryId: "",
    supplierId: null as number | null,
    supplierName: "",
    unitPrice: 0,
    reorderLevel: "",
    initialStock: "",
  });

  /* ======================================================
     FETCH CATEGORIES
  ====================================================== */
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch("/categories?limit=100");
        const json = await res.json();
        if (json.success) setCategories(json.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, []);

  /* ======================================================
     VALIDATION
  ====================================================== */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.productName.trim()) e.productName = "Nama produk wajib diisi";
    if (!form.categoryId) e.category = "Kategori wajib dipilih";
    if (!form.unitPrice || Number(form.unitPrice) <= 0)
      e.unitPrice = "Harga satuan harus lebih dari 0";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ======================================================
     SAVE
  ====================================================== */
  const handleSave = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      // 1️⃣ CREATE PRODUCT
      const res = await apiFetch("/products", {
        method: "POST",
        body: JSON.stringify({
          cardNumber: form.cardNumber || null,
          productName: form.productName,
          partNumber: form.partNumber || null,
          description: form.description || null,
          categoryId: Number(form.categoryId),
          supplierId: form.supplierId,
          unitPrice: Number(form.unitPrice),
          reorderLevel: Number(form.reorderLevel) || 0,
          status: "active",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menambahkan produk");
      }

      const productId = json.product.id;

      // 2️⃣ INITIAL STOCK → STOCK ADJUSTMENT
      if (Number(form.initialStock) > 0) {
        await apiFetch("/inventory-adjustments", {
          method: "POST",
          body: JSON.stringify({
            productId: productId,
            newStock: Number(form.initialStock),
            notes: "Stok awal produk",
          }),
        });
      }

      alert("Produk berhasil ditambahkan!");
      router.push("/products");
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan produk.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-5xl mx-auto">
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
                Add New Product
              </h1>
              <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Masukkan rincian spesifikasi barang dan stok awal ke katalog.
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
            onClick={handleSave}
            disabled={isLoading}
            className="btn-gradient border-0 px-6 py-2 text-xs sm:text-sm"
          >
            <Save className="mr-1.5 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </div>
      </div>

      {/* FORM CARD CONTAINER */}
      <Card className="enhanced-card border border-pink-100/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 via-rose-50/30 to-transparent border-b border-pink-100/50 p-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
                Informasi & Spesifikasi Produk
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Pastikan data yang diinput sudah sesuai dengan fisik atau kartu barang.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-7">
          <div className="grid gap-6 md:grid-cols-2">
            {/* KOLOM KIRI: IDENTITAS PRODUK */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Product Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  placeholder="Contoh: Skincare Serum Glow 30ml"
                  value={form.productName}
                  onChange={(e) =>
                    setForm({ ...form, productName: e.target.value })
                  }
                  className={`rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 transition-all ${
                    errors.productName ? "border-rose-400 focus:ring-rose-200" : ""
                  }`}
                />
                {errors.productName && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.productName}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Category <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) =>
                    setForm({ ...form, categoryId: value })
                  }
                >
                  <SelectTrigger className={`rounded-xl bg-white/90 border-slate-200 focus:ring-pink-200 ${
                    errors.category ? "border-rose-400" : ""
                  }`}>
                    <SelectValue placeholder="Pilih kategori barang" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-pink-200 bg-white/95 backdrop-blur-md">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="hover:bg-pink-50">
                        {c.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.category}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Card Number
                </Label>
                <Input
                  placeholder="Kode nomor kartu stok (opsional)"
                  value={form.cardNumber}
                  onChange={(e) =>
                    setForm({ ...form, cardNumber: e.target.value })
                  }
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Part Number
                </Label>
                <Input
                  placeholder="Kode part manufaktur (opsional)"
                  value={form.partNumber}
                  onChange={(e) =>
                    setForm({ ...form, partNumber: e.target.value })
                  }
                  className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                />
              </div>
            </div>

            {/* KOLOM KANAN: SUPPLIER & STOK */}
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Supplier
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={form.supplierName}
                    readOnly
                    placeholder="Pilih supplier pemasok"
                    className="rounded-xl bg-slate-50/80 border-slate-200 text-slate-700"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenSupplierModal(true)}
                    className="rounded-xl bg-white/90 hover:bg-pink-50/70 border border-pink-200/80 text-pink-600 hover:text-pink-700 font-medium px-4"
                  >
                    <Building className="w-3.5 h-3.5 mr-1.5 text-pink-500" />
                    Pilih
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                  Unit Price (Rp) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={form.unitPrice || ""}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: Number(e.target.value) })
                  }
                  className={`rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 ${
                    errors.unitPrice ? "border-rose-400 focus:ring-rose-200" : ""
                  }`}
                />
                {errors.unitPrice && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">{errors.unitPrice}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Reorder Level
                  </Label>
                  <Input
                    type="number"
                    placeholder="Min. stok aman"
                    value={form.reorderLevel}
                    onChange={(e) =>
                      setForm({ ...form, reorderLevel: e.target.value })
                    }
                    className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Initial Stock
                  </Label>
                  <Input
                    type="number"
                    placeholder="Stok saat ini"
                    value={form.initialStock}
                    onChange={(e) =>
                      setForm({ ...form, initialStock: e.target.value })
                    }
                    className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DESKRIPSI PRODUK */}
          <div className="pt-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Deskripsi & Catatan Tambahan
            </Label>
            <Textarea
              rows={3}
              placeholder="Tuliskan spesifikasi, deskripsi, atau catatan fisik produk di sini..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* SUPPLIER MODAL */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={(s: Supplier) =>
          setForm((f) => ({
            ...f,
            supplierId: s.id,
            supplierName: s.name,
          }))
        }
      />
    </div>
  );
}
