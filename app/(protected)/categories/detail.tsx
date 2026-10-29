"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { ArrowLeft, Save, Trash2, Edit, Folder, Layers, DollarSign, Calendar, Clock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTableV2 as DataTable } from "@/components/data-table";
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

// ----------------------
// MOCK PRODUCT DATA
// ----------------------

interface Product {
  id: number
  cardNumber: string | null
  productName: string
  category: string
  partNumber: string | null
  stock: number
  status?: string
}

const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "productName",
    header: "Product Name",
    cell: ({ row }) => {
      const name = row.getValue("productName") as string;
      return (
        <span className="font-semibold text-gray-800 hover:text-pink-600 transition-colors">
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: "partNumber",
    header: "Part Number",
    cell: ({ row }) => {
      const partNumber = row.getValue("partNumber") as string;
      return partNumber ? (
        <span className="text-xs text-gray-700">
          {partNumber}
        </span>
      ) : (
        <span className="text-gray-400 text-xs italic">-</span>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <span className="font-semibold text-gray-800">
          {stock ?? 0}
        </span>
      );
    },
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("unitPrice") as number;
      return (
        <span className="font-semibold text-gray-800">
          {price !== undefined && price !== null ? price.toLocaleString() : "0"}
        </span>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => (
      <span className="text-gray-600 font-medium">
        {row.getValue("supplier") || "-"}
      </span>
    ),
  },
];

// ----------------------
// MAIN COMPONENT
// ----------------------
export default function CategoryDetailPage({ id }: { id: string }) {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)
  const [search, setSearch] = React.useState("")
  const [data, setData] = React.useState<Product[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);

  // ✅ category diambil dari backend untuk "Category Information"
  const [category, setCategory] = React.useState({
    id: id as string,
    categoryName: "",
    description: "",
    productCount: 45, // dummy
    totalValue: 15750.25, // dummy
    createdDate: "",
    lastUpdated: "",
  });

  // ==============================
  // 🔍 Fetch category detail (API)
  // ==============================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/categories/${id}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Gagal memuat kategori");

      const data = json.data;
      setCategory((prev) => ({
        ...prev,
        categoryName: data.name || "",
        description: data.description || "",
        createdDate: new Date(data.createdAt).toISOString().split("T")[0],
        lastUpdated: new Date(data.updatedAt).toISOString().split("T")[0],
      }));

      console.log("✅ Fetched category:", data);
    } catch (err: any) {
      console.error("❌ Gagal fetch kategori:", err);
      alert(err.message || "Terjadi kesalahan saat memuat data kategori");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductData = async () => {
    setIsLoadingProduct(true);
    // Implementasi fetch produk berdasarkan kategori jika diperlukan
    try {
      const sortField = sorting[0]?.id ?? "createdAt"
      const sortOrder = sorting[0]?.desc ? "desc" : "asc"
      const res = await apiFetch(
        `/products?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(
          search
        )}&sortField=${sortField}&sortOrder=${sortOrder}&filters=[
            {"field":"category_id","operator":"=","value":${id}}
          ]`, {
        method: "GET",
      }
      )

      if (!res.ok) throw new Error("Failed to fetch products")
      const json = await res.json()
      setData(json.data)
      setTotalCount(json.totalCount)
    } catch (err) {
      console.error("Failed to load products:", err)
      // fallback dummy data
      setData([
        {
          id: 1,
          cardNumber: "C001",
          productName: "Widget A",
          category: "Electronics",
          partNumber: "PN001",
          stock: 75,
          status: "active",
        },
        {
          id: 2,
          cardNumber: "C002",
          productName: "Widget B",
          category: "Mechanical",
          partNumber: "PN002",
          stock: 40,
          status: "active",
        },
      ])
      setTotalCount(2)
    } finally {
      setIsLoadingProduct(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [id]);

  React.useEffect(() => {
    fetchProductData();
  }, [
    id,
    pageIndex,
    pageSize,
    search,
    sorting,
  ]);

  // ==============================
  // 💾 Handle save (PUT)
  // ==============================
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          categoryName: category.categoryName,
          description: category.description,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui kategori");
      }

      alert("Kategori berhasil diperbarui!");
      setIsEditing(false);
      fetchData(); // refresh data
    } catch (err: any) {
      console.error("❌ Update gagal:", err);
      alert(err.message || "Terjadi kesalahan saat update kategori");
    } finally {
      setIsLoading(false);
    }
  };

  // ==============================
  // 🗑️ Handle delete (dummy dulu)
  // ==============================
  const handleDelete = async (id: number) => {
    try {
      const res = await apiFetch(`/categories/${id}`, {
        method: "DELETE",
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        alert(result.message || "Failed to delete category")
        return
      }

      alert("Category deleted successfully")

      // 🔄 Refresh data
      router.push("/categories")
    } catch (error) {
      console.error("Delete category failed:", error)
      alert("Failed to delete category. Please try again.")
    }
  };

  // ==============================
  // 🧱 UI
  // ==============================
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
                {category.categoryName || "Category Detail"}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
                <Folder className="w-3 h-3 text-pink-500" /> ID #{id}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Kelola informasi kategori dan pantau inventaris produk terkait
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
              Edit Category
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="bg-white/80 hover:bg-white border-pink-200 text-gray-700 rounded-full px-4 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-gradient border-0 rounded-full px-5 shadow-sm text-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isLoading}
                className="rounded-full px-4 text-sm bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 shadow-none"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md border border-pink-200/80 rounded-2xl shadow-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-900 font-bold">Hapus Kategori Ini?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600 text-sm">
                  Tindakan ini tidak dapat dibatalkan. Kategori ini akan dihapus secara permanen dari sistem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 rounded-full text-sm">
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(parseInt(category.id))}
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
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Products</span>
            <div className="p-2.5 rounded-xl bg-pink-100/70 text-pink-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-gray-900">{category.productCount}</div>
          <p className="text-xs text-pink-600 font-medium mt-1">Produk terdaftar</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Estimated Value</span>
            <div className="p-2.5 rounded-xl bg-emerald-100/70 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600">
            ${category.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1">Nilai aset kategori</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Created Date</span>
            <div className="p-2.5 rounded-xl bg-purple-100/70 text-purple-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {category.createdDate || "-"}
          </div>
          <p className="text-xs text-gray-400 mt-1">Tanggal pembuatan</p>
        </div>

        <div className="enhanced-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Last Updated</span>
            <div className="p-2.5 rounded-xl bg-amber-100/70 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-base font-semibold text-gray-800">
            {category.lastUpdated || "-"}
          </div>
          <p className="text-xs text-gray-400 mt-1">Pembaruan terakhir</p>
        </div>
      </div>

      {/* Category Information Form */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Informasi Kategori</h2>
              <p className="text-xs text-gray-500">Ubah atribut nama dan deskripsi kategori</p>
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
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryName" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Nama Kategori <span className="text-pink-500">*</span>
                </Label>
                <Input
                  id="categoryName"
                  value={category.categoryName}
                  onChange={(e) => setCategory({ ...category, categoryName: e.target.value })}
                  placeholder="e.g. Spareparts, Apparel, Stationary..."
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 h-11 bg-white/70"
                  disabled={!isEditing}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="createdDate" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Tanggal Dibuat
                </Label>
                <Input
                  id="createdDate"
                  type="date"
                  value={category.createdDate}
                  className="rounded-xl border-pink-100 bg-gray-50/80 text-gray-500 h-11"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Deskripsi Kategori
                </Label>
                <Textarea
                  id="description"
                  value={category.description}
                  onChange={(e) => setCategory({ ...category, description: e.target.value })}
                  rows={4}
                  placeholder="Tambahkan catatan atau detail spesifikasi kategori ini..."
                  className="rounded-xl border-pink-200/80 focus:border-pink-400 focus:ring-pink-200 resize-none bg-white/70"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Produk dalam Kategori Ini</h2>
              <p className="text-xs text-gray-500">Daftar inventaris yang dikaitkan dengan kategori ini</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-100/70 text-pink-700">
            {totalCount} Total Items
          </span>
        </div>

        <div className="p-6">
          <DataTable
            columns={productColumns}
            data={data}
            totalCount={totalCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            loading={isLoadingProduct}
            searchPlaceholder="Cari nama atau part number produk..."
            onSearchChange={(val) => {
              setPageIndex(0);
              setSearch(val);
            }}
            onPaginationChange={(newPage, newSize) => {
              setPageIndex(newPage);
              setPageSize(newSize);
            }}
            onSortingChange={setSorting}
          />
        </div>
      </div>
    </div>
  );
}
