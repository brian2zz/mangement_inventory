"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { DataTableV2 as DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, ArrowUpDown, Tags, Sparkles, FolderTree } from "lucide-react";
import Link from "next/link";
import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder";

interface Category {
  id: string;
  categoryName: string;
  productCount: number;
}

export default function CategoriesPage() {
  const router = useRouter();

  // State utama
  const [data, setData] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kontrol tabel
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Field filter
  const fields: FieldOption[] = [
    { name: "name", label: "Nama Kategori", type: "string" },
    { name: "createdAt", label: "Tanggal Dibuat", type: "date" },
    { name: "status", label: "Status", type: "string" },
  ];

  /**
   * Ambil data kategori dari API
   */
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        search,
        sortField: sorting[0]?.id ?? "name",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      });

      if (Array.isArray(filters) && filters.length > 0) {
        params.append("filters", JSON.stringify(filters));
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories?${params.toString()}`, {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      let json;
      try {
        json = await res.json();
      } catch {
        throw new Error("Invalid JSON response dari server");
      }

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

  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, sorting, filters]);

  // Kolom tabel (Soft Luxury Styling)
  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      accessorKey: "id",
      header: () => <span className="font-medium text-slate-600 text-xs uppercase">ID</span>,
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
          #{row.getValue("id")}
        </span>
      ),
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="font-medium text-slate-600 hover:text-pink-600 hover:bg-pink-50/60 rounded-lg px-2 -ml-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Kategori
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-100/70 text-pink-600 flex items-center justify-center shrink-0">
            <FolderTree className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-800 text-sm hover:text-pink-600 transition-colors">
            {row.getValue("categoryName")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "productCount",
      header: () => <span className="font-medium text-slate-600 text-xs uppercase">Jumlah Produk</span>,
      cell: ({ row }) => {
        const count = Number(row.getValue("productCount")) || 0;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              count > 0
                ? "bg-pink-50 text-pink-700 border border-pink-200/80"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {count} Produk
          </span>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6 min-h-screen p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Header halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Product Categories
            </h1>
            <span className="p-1 rounded-full bg-pink-100/70 text-pink-500">
              <Tags className="w-4 h-4" />
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola pengelompokan klasifikasi kategori dan jenis produk dalam inventaris.
          </p>
        </div>

        <Button asChild className="btn-gradient border-0 px-4 py-2 text-xs sm:text-sm">
          <Link href="/categories/add" className="flex items-center">
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Kategori
          </Link>
        </Button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p className="text-sm font-medium flex-1">{errorMessage}</p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-rose-300 text-rose-600 hover:bg-rose-100"
            onClick={() => {
              setErrorMessage(null);
              fetchData();
            }}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Data Table */}
      <div className="enhanced-card p-6 shadow-sm border border-pink-100/80">
        <DataTable<Category, unknown>
          columns={columns}
          data={data}
          totalCount={total}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          searchPlaceholder="Cari nama kategori..."
          haveFilter
          filterComponent={
            <FilterBuilder
              fields={fields}
              value={filters}
              onApply={(newFilters) => {
                setFilters(newFilters);
                setPageIndex(0);
              }}
            />
          }
          haveFilterExport={false}
          linkExport="/categories/export"
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex);
            setPageSize(newPageSize);
          }}
          onSortingChange={(newSorting) => setSorting(newSorting)}
          onSearchChange={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          onRowClick={(row) => router.push(`/categories?id=${row.id}`)}
        />
      </div>
    </div>
  );
}
