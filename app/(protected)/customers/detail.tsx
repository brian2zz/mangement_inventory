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
  Users,
  Calendar,
  Clock,
  Sparkles,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { apiFetch } from "@/lib/api"

export default function CustomerDetailPage({ id }: { id: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const [customer, setCustomer] = React.useState({
    id: id || "",
    customerName: "",
    phoneNumber: "",
    email: "",
    address: "",
    contactPerson: "",
    status: "active",
    createdAt: "",
    updatedAt: "",
  })

  // 🔹 Fetch data customer dari backend Laravel
  const fetchCustomer = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const res = await apiFetch(`/customers/${id}`, { method: "GET" })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error || "Gagal memuat customer")
      }
      const data = json.data || json.customer || json

      setCustomer({
        id: String(data.id ?? id),
        customerName: data.name || data.customerName || "",
        phoneNumber: data.phone || data.phoneNumber || "",
        email: data.email || "",
        address: data.address || "",
        contactPerson: data.contact_person || data.contactPerson || "",
        status: data.status || "active",
        createdAt: data.created_at || data.createdAt || "",
        updatedAt: data.updated_at || data.updatedAt || "",
      })
    } catch (err: any) {
      console.error("Gagal memuat customer:", err)
      alert(err.message || "Gagal memuat data customer")
      router.push("/customers")
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  React.useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  // ✏️ Simpan perubahan (PUT /customers/{id})
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: customer.customerName,
          customerName: customer.customerName,
          phone: customer.phoneNumber,
          phoneNumber: customer.phoneNumber,
          email: customer.email,
          address: customer.address,
          contact_person: customer.contactPerson,
          contactPerson: customer.contactPerson,
          status: customer.status,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error || "Gagal memperbarui customer")
      }

      alert("✅ Data customer berhasil disimpan!")
      setIsEditing(false)
      fetchCustomer() // refresh data
    } catch (err: any) {
      alert(`❌ Error: ${err.message || "Gagal memperbarui data"}`)
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // 🗑️ Hapus customer (DELETE /customers/{id})
  const handleDelete = async () => {
    setIsSaving(true)
    try {
      const res = await apiFetch(`/customers/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || json.success === false) {
        throw new Error(json.error || "Gagal menghapus customer")
      }

      alert("🗑️ Customer berhasil dihapus!")
      router.push("/customers")
    } catch (err: any) {
      alert(`❌ Gagal menghapus: ${err.message || "Terjadi kesalahan"}`)
      console.error(err)
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
        Memuat detail customer...
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
            onClick={() => router.push("/customers")}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 shadow-xs transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                {customer.customerName || "Customer Detail"}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <Users className="w-3 h-3 text-pink-500" /> ID #{customer.id}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Profil pelanggan, narahubung (PIC), dan alamat tujuan pengiriman
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  fetchCustomer()
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
                disabled={isSaving}
                className="rounded-full px-4 text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-none"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border border-pink-200/80 rounded-2xl shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 font-bold">Hapus Customer Ini?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-sm">
                  Tindakan ini tidak dapat dibatalkan. Data customer akan dihapus secara permanen dari sistem.
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

      {/* Summary Cards (Data Nyata dari Database) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Status Akun</span>
            <div className="p-2.5 rounded-xl bg-pink-100/70 text-pink-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <Badge
              className={
                customer.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-sm px-3 py-1"
                  : "bg-gray-100 text-gray-700 border-gray-200 shadow-none font-semibold text-sm px-3 py-1"
              }
            >
              {customer.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-pink-600 font-medium mt-2">Status keaktifan customer</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact Person</span>
            <div className="p-2.5 rounded-xl bg-blue-100/70 text-blue-600">
              <User className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-bold text-gray-800 truncate">
            {customer.contactPerson || "-"}
          </div>
          <p className="text-xs text-blue-700 font-medium mt-1">Perwakilan / PIC</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Terdaftar Sejak</span>
            <div className="p-2.5 rounded-xl bg-purple-100/70 text-purple-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {formatDate(customer.createdAt)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Tanggal registrasi akun</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pembaruan Terakhir</span>
            <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {formatDate(customer.updatedAt)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Sinkronisasi database</p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Informasi Customer</h2>
              <p className="text-xs text-gray-500">Perbarui identitas customer, kontak person, dan alamat pengiriman</p>
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
                  Nama Customer / Perusahaan <span className="text-pink-500">*</span>
                </Label>
                <Input
                  value={customer.customerName}
                  onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
                  disabled={!isEditing}
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Contact Person (PIC)</Label>
                <Input
                  value={customer.contactPerson}
                  onChange={(e) => setCustomer({ ...customer, contactPerson: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Nama narahubung / PIC..."
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nomor Telepon <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Input
                    value={customer.phoneNumber}
                    onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Alamat Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Input
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    disabled={!isEditing}
                    placeholder="email@customer.com"
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Alamat Lengkap Pengiriman <span className="text-pink-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-pink-400" />
                  <Textarea
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Alamat kantor, gudang, atau rumah tujuan kirim..."
                    className="pl-10 rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Status Akun</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-pink-100 bg-white/70">
                  <Switch
                    id="customer-status-switch"
                    checked={customer.status === "active"}
                    onCheckedChange={(checked) =>
                      setCustomer({ ...customer, status: checked ? "active" : "inactive" })
                    }
                    disabled={!isEditing}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {customer.status === "active" ? "Aktif (Active)" : "Non-aktif (Inactive)"}
                    </span>
                    <Badge
                      className={
                        customer.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5"
                          : "bg-rose-50 text-rose-700 border-rose-200 shadow-none font-semibold text-xs px-2.5 py-0.5"
                      }
                    >
                      {customer.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {isEditing && (
                  <p className="text-[11px] text-gray-400">
                    Geser toggle switch untuk mengaktifkan atau menonaktifkan akun customer ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
