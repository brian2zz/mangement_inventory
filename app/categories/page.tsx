"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { DataTableV2 as DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder";

interface Category {
  id: string;
  categoryName: string;
  productCount: number;
}

export default function CategoriesPage() {
  const router = useRouter();

  // 🔹 State utama
  const [data, setData] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 🔹 Kontrol tabel
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<any[]>([]);

  // 🔹 Field filter
  const fields: FieldOption[] = [
    { name: "name", label: "Nama Kategori", type: "string" },
    { name: "createdAt", label: "Tanggal Dibuat", type: "date" },
    { name: "status", label: "Status", type: "string" },
  ];

  /**
   * 🔍 Ambil data kategori dari API dengan aman
   */
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null); // reset error

    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        search,
        sortField: sorting[0]?.id ?? "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      });

      // ✅ Hindari error kalau filters undefined
      if (Array.isArray(filters) && filters.length > 0) {
        params.append("filters", JSON.stringify(filters));
      }

      const res = await fetch(`/api/categories?${params.toString()}`);

      if (!res.ok) {
        // Tangkap response error dari server
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Invalid JSON response dari server");
      }

      // ✅ Validasi data agar aman
      if (!json || !Array.isArray(json.data)) {
        throw new Error("Data tidak valid dari server");
      }

      setData(json.data);
      setTotal(json.total ?? 0);
    } catch (err: any) {
      console.error("❌ Gagal fetch kategori:", err);
      setErrorMessage(err.message || "Terjadi kesalahan saat memuat data kategori.");
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Re-fetch saat parameter berubah
  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, sorting, filters]);

  // 📊 Kolom tabel
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "categoryName", header: "Nama Kategori" },
    { accessorKey: "productCount", header: "Jumlah Produk" },
  ], []);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* Header halaman */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Product Categories
        </h1>

        <Button asChild className="btn-gradient border-0">
          <Link href="/categories/add">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
          </Link>
        </Button>
      </div>

      {/* ⚠️ Tampilkan error message di UI */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm flex-1">{errorMessage}</p>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-100"
            onClick={() => {
              setErrorMessage(null);
              fetchData(); // coba ulang
            }}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* 🧾 Data Table */}
      <div className="enhanced-card p-6">

        <DataTable<Category, unknown>
          columns={columns}
          data={data}
          totalCount={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilter
          filterComponent={
            <FilterBuilder
              fields={fields}
              value={filters} // ✅ kirim filter aktif ke modal
              onApply={(newFilters) => {
                setFilters(newFilters);
                setPageIndex(0);
              }}
            />
          }
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex);
            setPageSize(newPageSize);
          }}
          onSortingChange={(newSorting) => setSorting(newSorting)}
          onSearchChange={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          onRowClick={(row) => router.push(`/categories/${row.id}`)}
        />
      </div>
    </div>
  );
}
