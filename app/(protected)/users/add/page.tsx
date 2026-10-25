"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, EyeOff, ShieldCheck, User as UserIcon, Mail, Phone, MapPin, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { apiFetch } from "@/lib/api"

export default function AddUserPage() {
  const router = useRouter()
  const { hasPermission } = useAuth()

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "staff" as "admin" | "staff" | "viewer",
    password: "",
    confirmPassword: "",
    status: "active" as "active" | "inactive",
  })

  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Check admin permission
  if (!hasPermission("admin")) {
    return (
      <div className="space-y-6 min-h-screen flex items-center justify-center p-6">
        <div className="enhanced-card p-8 text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Akses Terbatas</h1>
          <p className="text-sm text-gray-500">
            Hanya Administrator yang memiliki wewenang untuk menambahkan akun pengguna baru.
          </p>
          <Button onClick={() => router.push("/")} className="btn-gradient border-0 rounded-full px-5 mt-6 text-xs font-semibold">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nama pengguna wajib diisi"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid"
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi password tidak cocok"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const res = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          address: formData.address || null,
          role: formData.role,
          status: formData.status,
          password: formData.password,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.message || json.error || "Gagal menambahkan user")
      }

      alert("✅ Pengguna baru berhasil ditambahkan!")
      router.push("/users")
    } catch (error: any) {
      alert(`❌ Error: ${error.message || "Gagal menambahkan pengguna"}`)
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
                Tambah User Baru
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <Sparkles className="w-3 h-3 text-pink-500" /> Baru
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Daftarkan staf atau admin baru dan tentukan hak akses peran (role)
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
            {isLoading ? "Menyimpan..." : "Simpan Pengguna"}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Informasi Akun Pengguna</h2>
            <p className="text-xs text-gray-500">Lengkapi data profil dan tetapkan kredensial awal untuk login</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nama Lengkap <span className="text-pink-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Salsabila Putri"
                  className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                    errors.name ? "border-rose-400" : ""
                  }`}
                />
                {errors.name && <p className="text-rose-500 text-xs mt-0.5">{errors.name}</p>}
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Alamat Email <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@inventra.com"
                    className={`pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 ${
                      errors.email ? "border-rose-400" : ""
                    }`}
                  />
                </div>
                {errors.email && <p className="text-rose-500 text-xs mt-0.5">{errors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Nomor Telepon</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Hak Akses (Role) <span className="text-pink-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(val: any) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border-pink-200">
                    <SelectItem value="admin">Admin (Akses Penuh Sistem)</SelectItem>
                    <SelectItem value="staff">Staff (Manajemen Transaksi & Stok)</SelectItem>
                    <SelectItem value="viewer">Viewer (Hanya Lihat / Read-Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Alamat Lengkap</Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    placeholder="Alamat domisili atau operasional staf..."
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Password Akun <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 pr-10 ${
                      errors.password ? "border-rose-400" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-rose-500 text-xs mt-0.5">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Konfirmasi Password <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Ketik ulang password"
                    className={`rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70 pr-10 ${
                      errors.confirmPassword ? "border-rose-400" : ""
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-rose-500 text-xs mt-0.5">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
