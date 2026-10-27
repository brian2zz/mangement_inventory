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
  ArrowUpRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 } from "@/components/data-table";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface OutgoingReportRow {
  id: number;
  date: string;
  productName: string;
  category: string;
  partNumber: string;
  source: string;
  destination: string;
  quantityOut: number;
  currentStock: number;
  remarks: string;
}

export default function OutgoingProductReportPage() {
  const [data, setData] = React.useState<OutgoingReportRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  
  const columns = React.useMemo<ColumnDef<OutgoingReportRow>[]>(
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
        header: "Nama Barang",
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
        accessorKey: "source",
        header: "Gudang Asal",
        cell: ({ row }) => {
          const src = row.getValue("source") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <WarehouseIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>{src || "-"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "destination",
        header: "Customer (Tujuan)",
        cell: ({ row }) => {
          const dst = row.getValue("destination") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Building2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="truncate max-w-[150px] font-medium">{dst || "-"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "quantityOut",
        header: () => <div className="text-center w-full">Jumlah Keluar</div>,
        cell: ({ row }) => {
          const qty = row.getValue("quantityOut") as number;
          return (
            <div className="flex items-center gap-1 text-xs font-bold text-rose-700">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
              <span>-{qty ?? 0}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "currentStock",
        header: "Sisa Stok",
        cell: ({ row }) => {
          const val = Number(row.getValue("currentStock")) || 0;
          return (
            <span className="font-mono text-xs font-bold text-gray-800">
              {val} Unit
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

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);

      const sort = sorting[0];
      const sortField = sort?.id || "date";
      const sortOrder = sort?.desc ? "desc" : "asc";

      const params = new URLSearchParams();
      params.set("page", String(pageIndex + 1));
      params.set("limit", String(pageSize));
      params.set("search", search);
      params.set("sortField", sortField);
      params.set("sortOrder", sortOrder);

      const res = await apiFetch(`/reports/outgoing?${params.toString()}`, {
        method: "GET",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat laporan pengeluaran");
      }

      setData(json.data || []);
      setTotalCount(json.totalCount ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, search, sorting]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Laporan Barang Keluar
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100/70 text-rose-700">
              <FileSpreadsheet className="w-3 h-3 text-rose-500" /> Outgoing Audit Report
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Rekapitulasi lengkap riwayat pengiriman barang ke customer dan pengurangan stok
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
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
        <DataTableV2
          columns={columns}
          data={data}
          loading={loading}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          haveFilterExport={true}
          linkExport="/report-outgoing/export"
          searchPlaceholder="Cari berdasarkan produk, customer, gudang..."
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
