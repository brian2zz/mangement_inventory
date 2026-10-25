"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Building2, Phone, Mail, MapPin, User, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/api"

export default function AddSupplierPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [serverError, setServerError] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    supplierName: "",
    phoneNumber: "",
    address: "",
    email: "",
    contactPerson: "",
    notes: "",
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplierName.trim()) {
      newErrors.supplierName = "Nama supplier wajib diisi"
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Nomor telepon wajib diisi"
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat wajib diisi"
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setServerError(null)

    try {
      const res = await apiFetch("/suppliers", {
        method: "POST",
        body: JSON.stringify({
          name: formData.supplierName,
          phone: formData.phoneNumber,
          address: formData.address,
          email: formData.email,
          contactPerson: formData.contactPerson,
          notes: formData.notes,
          status: "active",
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Gagal menyimpan supplier")
      }

      alert("✅ Supplier berhasil ditambahkan!")
      router.push("/suppliers")
    } catch (error: any) {
      console.error("Error saving supplier:", error)
      setServerError(error.message || "Gagal menyimpan supplier. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

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
                Tambah Supplier Baru
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <Sparkles className="w-3 h-3 text-pink-500" /> Baru
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Daftarkan vendor atau rekanan pemasok inventaris baru ke dalam sistem
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-sm"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Menyimpan..." : "Simpan Supplier"}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm shadow-xs flex items-center justify-between">
          <p>{serverError}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setServerError(null)}
            className="text-rose-600 hover:bg-rose-100 rounded-full h-7 px-2"
          >
            Tutup
          </Button>
        </div>
      )}

      {/* Form Card */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Informasi Supplier</h2>
            <p className="text-xs text-gray-500">Lengkapi data kontak dan alamat operasional pemasok</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="supplierName" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nama Supplier <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="supplierName"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="Contoh: PT. Sumber Makmur Perkasa"
                    className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                      errors.supplierName ? "border-rose-400 focus:border-rose-500" : ""
                    }`}
                  />
                </div>
                {errors.supplierName && <p className="text-rose-500 text-xs mt-0.5">{errors.supplierName}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nomor Telepon <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Contoh: 081234567890 / 021-5551234"
                    className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                      errors.phoneNumber ? "border-rose-400 focus:border-rose-500" : ""
                    }`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-rose-500 text-xs mt-0.5">{errors.phoneNumber}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: vendor@sumbermakmur.com"
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                    errors.email ? "border-rose-400 focus:border-rose-500" : ""
                  }`}
                />
                {errors.email && <p className="text-rose-500 text-xs mt-0.5">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactPerson" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nama Person in Charge (PIC)
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Contoh: Bpk. Budi Santoso"
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Alamat Lengkap <span className="text-pink-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Industri Raya Blok C No. 12, Kawasan Industri..."
                  rows={4}
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70 ${
                    errors.address ? "border-rose-400 focus:border-rose-500" : ""
                  }`}
                />
                {errors.address && <p className="text-rose-500 text-xs mt-0.5">{errors.address}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Catatan Tambahan
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ketentuan pengiriman, rekening pembayaran, atau preferensi pesanan..."
                  rows={4}
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
