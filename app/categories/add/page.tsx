"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
      if (!cat.categoryName.trim()) rowErrors.categoryName = "Category name is required"
      if (Object.keys(rowErrors).length > 0) newErrors[index] = rowErrors
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddRow = () => {
    setCategories([...categories, { categoryName: "", description: "" }])
  }

  const handleRemoveRow = (index: number) => {
    const newCategories = categories.filter((_, i) => i !== index)
    setCategories(newCategories)
    // Remove errors for this row
    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const res = await fetch("/api/categories/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        alert(result.message || "Failed to add categories")
        setIsLoading(false)
        return
      }

      alert("Categories added successfully!")
      router.push("/categories")
    } catch (error) {
      console.error(error)
      alert("Failed to add categories. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="bg-white/80 hover:bg-white border-pink-200 hover:border-pink-300 transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Add New Categories
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()} className="bg-white/80 hover:bg-white border-pink-200">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient border-0">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Saving..." : "Save Categories"}
          </Button>
        </div>
      </div>

      <Card className="enhanced-card space-y-6">
        {categories.map((cat, index) => (
          <CardContent key={index} className="space-y-4 border-b last:border-none pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium">Category {index + 1}</CardTitle>
              {categories.length > 1 && (
                <Button variant="destructive" size="icon" onClick={() => handleRemoveRow(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`categoryName-${index}`}>Category Name *</Label>
                <Input
                  id={`categoryName-${index}`}
                  value={cat.categoryName}
                  onChange={(e) => {
                    const newCategories = [...categories]
                    newCategories[index].categoryName = e.target.value
                    setCategories(newCategories)
                  }}
                  className={`${errors[index]?.categoryName ? "border-red-500" : ""}`}
                  placeholder="Enter category name"
                />
                {errors[index]?.categoryName && <p className="text-red-500 text-sm">{errors[index].categoryName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={cat.description}
                  onChange={(e) => {
                    const newCategories = [...categories]
                    newCategories[index].description = e.target.value
                    setCategories(newCategories)
                  }}
                  placeholder="Enter description (optional)"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        ))}

        <Button variant="outline" onClick={handleAddRow} className="w-full justify-center">
          <Plus className="mr-2 h-4 w-4" />
          Add Another Category
        </Button>
      </Card>
    </div>
  )
}
