"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Users, Phone, Mail, MapPin, User, Building, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/api"

export default function AddCustomerPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState({
    customerName: "",
    phoneNumber: "",
    address: "",
    email: "",
    contactPerson: "",
    companyType: "",
    notes: "",
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Nama customer / klien wajib diisi"
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
    setErrors({})

    try {
      const res = await apiFetch("/customers", {
        method: "POST",
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Gagal menambahkan customer")
        return
      }

      alert("✅ Customer berhasil ditambahkan!")
      router.push("/customers")
    } catch (error) {
      console.error(error)
      alert("Gagal menambahkan customer. Silakan coba lagi.")
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
                Tambah Customer Baru
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <Sparkles className="w-3 h-3 text-pink-500" /> Baru
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Registrasikan pelanggan, klien ritel, atau korporat baru ke dalam sistem
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
            {isLoading ? "Menyimpan..." : "Simpan Customer"}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Informasi Customer</h2>
            <p className="text-xs text-gray-500">Lengkapi data kontak, kategori bisnis, dan alamat tujuan pengiriman</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="customerName" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nama Customer / Perusahaan <span className="text-pink-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Contoh: PT. Bintang Sinar Jaya / Amanda Olivia"
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                    errors.customerName ? "border-rose-400 focus:border-rose-500" : ""
                  }`}
                />
                {errors.customerName && <p className="text-rose-500 text-xs mt-0.5">{errors.customerName}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nomor Telepon / WhatsApp <span className="text-pink-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Contoh: 081298765432"
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                    errors.phoneNumber ? "border-rose-400 focus:border-rose-500" : ""
                  }`}
                />
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
                  placeholder="Contoh: order@bintangsinar.com"
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                    errors.email ? "border-rose-400 focus:border-rose-500" : ""
                  }`}
                />
                {errors.email && <p className="text-rose-500 text-xs mt-0.5">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactPerson" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Contact Person (PIC)
                </Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Contoh: Ibu Rina Melati"
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Alamat Pengiriman / Domisili <span className="text-pink-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Contoh: Jl. Gatot Subroto No. 45, Jakarta Selatan..."
                  rows={3}
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70 ${
                    errors.address ? "border-rose-400 focus:border-rose-500" : ""
                  }`}
                />
                {errors.address && <p className="text-rose-500 text-xs mt-0.5">{errors.address}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="companyType" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Tipe Perusahaan / Bidang Usaha
                </Label>
                <Input
                  id="companyType"
                  value={formData.companyType}
                  onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                  placeholder="Contoh: Retail, Distributor, Fashion, Konstruksi..."
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Catatan Tambahan
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ketentuan batas kredit, instruksi ekspedisi khusus, dsb..."
                  rows={3}
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
