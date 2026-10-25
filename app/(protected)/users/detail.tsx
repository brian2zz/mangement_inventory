"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  User as UserIcon,
  KeyRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/components/auth-provider"
import { apiFetch } from "@/lib/api"

export default function UserDetailPage({ id }: { id?: string }) {
  const router = useRouter()
  const { user: currentUser, hasPermission } = useAuth()

  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Reset Password State
  const [isResettingPassword, setIsResettingPassword] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [passwordError, setPasswordError] = React.useState("")

  const [userData, setUserData] = React.useState({
    id: id || "",
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "staff" as "admin" | "staff" | "viewer",
    status: "active" as "active" | "inactive" | "suspended",
    createdAt: "",
    updatedAt: "",
  })

  // Fetch data user dari backend
  const fetchUser = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const res = await apiFetch(`/users/${id}`, { method: "GET" })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Gagal memuat pengguna")
      }
      const data = json.data || json.user || json

      setUserData({
        id: String(data.id ?? id),
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        role: data.role || "staff",
        status: data.status || "active",
        createdAt: data.created_at || data.createdAt || "",
        updatedAt: data.updated_at || data.updatedAt || "",
      })
    } catch (err: any) {
      console.error("Gagal memuat user:", err)
      alert(err.message || "Gagal memuat data pengguna")
      router.push("/users")
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    if (hasPermission("admin")) {
      fetchUser()
    }
  }, [fetchUser, hasPermission])

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
            Halaman ini memerlukan hak akses Administrator untuk dapat mengelola kredensial akun.
          </p>
          <Button onClick={() => router.push("/")} className="btn-gradient border-0 rounded-full px-5 mt-6 text-xs font-semibold">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Handle Save (PUT /users/{id})
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          role: userData.role,
          status: userData.status,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.message || json.error || "Gagal memperbarui pengguna")
      }

      alert("✅ Data pengguna berhasil diperbarui!")
      setIsEditing(false)
      fetchUser()
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Terjadi kesalahan saat menyimpan"}`)
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Delete (DELETE /users/{id})
  const handleDelete = async () => {
    if (String(currentUser?.id) === String(id)) {
      alert("⚠️ Anda tidak dapat menghapus akun Anda sendiri saat sedang login!")
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch(`/users/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Gagal menghapus pengguna")
      }

      alert("🗑️ Akun pengguna berhasil dihapus!")
      router.push("/users")
    } catch (err: any) {
      alert(`❌ Gagal menghapus: ${err.message || "Terjadi kesalahan"}`)
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Reset Password (PATCH /users/{id}/reset-password)
  const handleResetPassword = async () => {
    setPasswordError("")
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok")
      return
    }

    setIsSaving(true)
    try {
      const res = await apiFetch(`/users/${id}/reset-password`, {
        method: "PATCH",
        body: JSON.stringify({
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Gagal mengatur ulang password")
      }

      alert("🔑 Password pengguna berhasil diperbarui!")
      setIsResettingPassword(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordError(err.message || "Gagal mengatur ulang password")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-pink-500 font-medium">
        Memuat detail pengguna...
      </div>
    )
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/users")}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 shadow-xs transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                {userData.name || "User Detail"}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <ShieldCheck className="w-3 h-3 text-pink-500" /> ID #{userData.id}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Kelola profil akun, hak akses role sistem, status aktif, dan reset kredensial
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  fetchUser()
                }}
                className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isSaving || String(currentUser?.id) === String(id)}
                className="rounded-full px-4 text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-none disabled:opacity-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border border-pink-200/80 rounded-2xl shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 font-bold">Hapus Akun Pengguna Ini?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-sm">
                  Tindakan ini tidak dapat dibatalkan. Akun ini tidak akan lagi dapat login ke dalam sistem Inventra.
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
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status Akun</span>
            <div className="p-2.5 rounded-xl bg-pink-100/70 text-pink-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <Badge
              className={
                userData.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-sm px-3 py-1 uppercase"
                  : "bg-rose-50 text-rose-700 border-rose-200 shadow-none font-semibold text-sm px-3 py-1 uppercase"
              }
            >
              {userData.status}
            </Badge>
          </div>
          <p className="text-xs text-pink-600 font-medium mt-2">Akses login sistem</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hak Akses (Role)</span>
            <div className="p-2.5 rounded-xl bg-purple-100/70 text-purple-600">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-gray-800 capitalize">
            {userData.role}
          </div>
          <p className="text-xs text-purple-700 font-medium mt-1">Tingkat wewenang</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Terdaftar Sejak</span>
            <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {formatDate(userData.createdAt)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Registrasi akun</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pembaruan Terakhir</span>
            <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {formatDate(userData.updatedAt)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Sinkronisasi database</p>
        </div>
      </div>

      {/* User Information Form */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Informasi Pengguna</h2>
              <p className="text-xs text-gray-500">Profil biodata, hak akses perizinan, dan status akun</p>
            </div>
          </div>
          {isEditing && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Mode Edit Aktif
            </span>
          )}
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
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  disabled={!isEditing}
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Alamat Email <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Input
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Nomor Telepon</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Input
                    value={userData.phone || ""}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Contoh: 08123456789"
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Hak Akses (Role) <span className="text-pink-500">*</span>
                </Label>
                {isEditing ? (
                  <Select
                    value={userData.role}
                    onValueChange={(val: any) => setUserData({ ...userData, role: val })}
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
                ) : (
                  <Input
                    value={userData.role.toUpperCase()}
                    disabled
                    className="rounded-xl border-pink-100 bg-gray-50/80 text-gray-600 h-11 font-medium"
                  />
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Alamat Lengkap</Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Textarea
                    value={userData.address || ""}
                    onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Alamat domisili atau kantor staf..."
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Status Akun</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-pink-100 bg-white/70">
                  <Switch
                    id="user-status-switch"
                    checked={userData.status === "active"}
                    onCheckedChange={(checked) =>
                      setUserData({ ...userData, status: checked ? "active" : "inactive" })
                    }
                    disabled={!isEditing}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {userData.status === "active" ? "Aktif (Active)" : "Non-aktif (Inactive)"}
                    </span>
                    <Badge
                      className={
                        userData.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5 uppercase"
                          : "bg-rose-50 text-rose-700 border-rose-200 shadow-none font-semibold text-xs px-2.5 py-0.5 uppercase"
                      }
                    >
                      {userData.status}
                    </Badge>
                  </div>
                </div>
                {isEditing && (
                  <p className="text-[11px] text-gray-400">
                    Akun non-aktif tidak akan dapat melakukan login ke dalam aplikasi.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Password Card */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Keamanan & Reset Password</h2>
              <p className="text-xs text-gray-500">Perbarui kata sandi akun pengguna jika staf lupa password</p>
            </div>
          </div>
          {!isResettingPassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResettingPassword(true)}
              className="bg-white/80 hover:bg-white border-pink-200 text-pink-700 rounded-full px-4 text-xs font-semibold shadow-xs"
            >
              Ubah Password
            </Button>
          )}
        </div>

        {isResettingPassword && (
          <div className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Password Baru <span className="text-pink-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Konfirmasi Password Baru <span className="text-pink-500">*</span>
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>
            </div>

            {passwordError && <p className="text-rose-500 text-xs font-medium">{passwordError}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsResettingPassword(false)
                  setNewPassword("")
                  setConfirmPassword("")
                  setPasswordError("")
                }}
                className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleResetPassword}
                disabled={isSaving}
                className="btn-gradient border-0 rounded-full px-5 text-xs font-semibold shadow-sm"
              >
                {isSaving ? "Menyimpan..." : "Simpan Password Baru"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
