"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, Tags, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface CategoryForm {
  categoryName: string
  description: string
}

export default function AddCategoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<number, Record<string, string>>>({})

  const [categories, setCategories] = React.useState<CategoryForm[]>([
    { categoryName: "", description: "" },
  ])

  const validateForm = () => {
    const newErrors: Record<number, Record<string, string>> = {}

    categories.forEach((cat, index) => {
      const rowErrors: Record<string, string> = {}
      if (!cat.categoryName.trim()) rowErrors.categoryName = "Nama kategori wajib diisi"
      if (Object.keys(rowErrors).length > 0) newErrors[index] = rowErrors
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddRow = () => {
    setCategories([...categories, { categoryName: "", description: "" }])
  }

  const handleRemoveRow = (index: number) => {
    if (categories.length === 1) return
    const newCategories = categories.filter((_, i) => i !== index)
    setCategories(newCategories)
    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const res = await apiFetch("/categories/bulk", {
        method: "POST",
        body: JSON.stringify({ categories }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        alert(result.message || "Gagal menambahkan kategori")
        setIsLoading(false)
        return
      }

      alert("Kategori berhasil ditambahkan!")
      router.push("/categories")
    } catch (error) {
      console.error(error)
      alert("Gagal menambahkan kategori. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

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
                Add Categories
              </h1>
              <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Buat satu atau beberapa kelompok kategori produk sekaligus.
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
            {isLoading ? "Menyimpan..." : "Simpan Kategori"}
          </Button>
        </div>
      </div>

      {/* FORM CARD CONTAINER */}
      <Card className="enhanced-card border border-pink-100/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-pink-50/50 via-rose-50/30 to-transparent border-b border-pink-100/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
              <Tags className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-800">
                Daftar Kategori Baru
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Anda dapat menambahkan lebih dari satu kategori dengan menekan tombol Tambah Baris.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddRow}
            className="rounded-full bg-white/90 hover:bg-pink-50/70 border border-pink-200/80 text-pink-600 hover:text-pink-700 font-medium px-4 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Tambah Baris
          </Button>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-5">
          {categories.map((category, index) => (
            <div
              key={index}
              className="p-5 rounded-2xl bg-white/80 border border-pink-100/70 shadow-xs space-y-4 relative group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200/60">
                  Kategori #{index + 1}
                </span>

                {categories.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRow(index)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Nama Kategori <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: Skincare, Serum, Packaging..."
                    value={category.categoryName}
                    onChange={(e) => {
                      const newCategories = [...categories]
                      newCategories[index].categoryName = e.target.value
                      setCategories(newCategories)
                    }}
                    className={`rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200 ${
                      errors[index]?.categoryName ? "border-rose-400" : ""
                    }`}
                  />
                  {errors[index]?.categoryName && (
                    <p className="text-rose-500 text-xs mt-1 font-medium">
                      {errors[index].categoryName}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Deskripsi Kategori (Opsional)
                  </Label>
                  <Input
                    placeholder="Keterangan singkat kategori..."
                    value={category.description}
                    onChange={(e) => {
                      const newCategories = [...categories]
                      newCategories[index].description = e.target.value
                      setCategories(newCategories)
                    }}
                    className="rounded-xl bg-white/90 border-slate-200 focus:border-pink-300 focus:ring-pink-200"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
