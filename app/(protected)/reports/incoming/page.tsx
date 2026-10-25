"use client";

import * as React from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  ArrowUpDown,
  FileSpreadsheet,
  Calendar,
  Building2,
  Package,
  Layers,
  Sparkles,
  Warehouse as WarehouseIcon,
  RefreshCw,
  TrendingDown,
  ArrowDownLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 as DataTable } from "@/components/data-table";
import { apiFetch } from "@/lib/api";

interface IncomingReport {
  id: number;
  date: string;
  productName: string;
  category: string;
  partNumber: string;
  supplier: string;
  warehouse: string;
  quantityIn: number;
  currentStock: number;
  remarks: string;
}

export default function IncomingProductReportPage() {
  const [data, setData] = React.useState<IncomingReport[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  // Table state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const columns = React.useMemo<ColumnDef<IncomingReport>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>{formatDate(row.getValue("date"))}</span>
          </div>
        ),
      },
      {
        accessorKey: "productName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nama Barang
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100/70 flex items-center justify-center text-pink-600 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-gray-800 text-xs">
                {row.getValue("productName") || "-"}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                {row.original.partNumber && row.original.partNumber !== "-"
                  ? `PN: ${row.original.partNumber}`
                  : ""}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Kategori",
        cell: ({ row }) => {
          const val = row.getValue("category") as string;
          return (
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-100">
              {val || "Umum"}
            </span>
          );
        },
      },
      {
        accessorKey: "supplier",
        header: "Pemasok",
        cell: ({ row }) => {
          const sup = row.getValue("supplier") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Building2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="truncate max-w-[150px]">{sup || "-"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "warehouse",
        header: "Gudang Masuk",
        cell: ({ row }) => {
          const wh = row.getValue("warehouse") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <WarehouseIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>{wh || "-"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "quantityIn",
        header: "Jumlah Masuk",
        cell: ({ row }) => {
          const qty = row.getValue("quantityIn") as number;
          return (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
              <span>+{qty ?? 0}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "currentStock",
        header: "Sisa Stok Saat Ini",
        cell: ({ row }) => {
          const val = row.getValue("currentStock") as number;
          return (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {val ?? 0} Unit
            </span>
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Keterangan",
        cell: ({ row }) => {
          const rem = row.getValue("remarks") as string;
          if (!rem || rem === "-" || rem.trim() === "") {
            return <span className="text-gray-300">-</span>;
          }
          return (
            <span className="text-xs text-gray-700 whitespace-normal break-words leading-relaxed">
              {rem}
            </span>
          );
        },
      },
    ],
    []
  );

  async function loadData() {
    setLoading(true);

    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      limit: pageSize.toString(),
      search,
      sortField: sorting[0]?.id ?? "date",
      sortOrder: sorting[0]?.desc ? "desc" : "asc",
    });

    try {
      const res = await apiFetch(`/reports/incoming?${query}`, {
        method: "GET",
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data || []);
        setTotalCount(json.totalCount ?? 0);
      }
    } catch (err) {
      console.error("Gagal load report:", err);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadData();
  }, [pageIndex, pageSize, search, sorting]);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Laporan Barang Masuk
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700">
              <FileSpreadsheet className="w-3 h-3 text-emerald-500" /> Incoming Audit Report
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Rekapitulasi lengkap riwayat penerimaan barang dari vendor ke seluruh gudang
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 text-gray-600 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-pink-500" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="enhanced-card p-4 sm:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          haveFilterExport={true}
          linkExport="/report-incoming/export"
          searchPlaceholder="Cari berdasarkan produk, supplier, keterangan..."
          onPaginationChange={(newPage, newSize) => {
            setPageIndex(newPage);
            setPageSize(newSize);
          }}
          onSortingChange={setSorting}
          onSearchChange={(val) => {
            setSearch(val);
            setPageIndex(0);
          }}
        />
      </div>
    </div>
  );
}
