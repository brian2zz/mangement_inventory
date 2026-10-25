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
  ClipboardList,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 } from "@/components/data-table";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface RequestReportRow {
  id: string;
  requestedItem: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  requestDate: string;
  fulfilledDate: string;
  store: string;
  unitPrice: string;
  totalPrice: string;
  remarks: string;
  supplierLocation: string;
}

export default function RequestReportPage() {
  const [data, setData] = React.useState<RequestReportRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "requestDate", desc: true },
  ]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "-";
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

  const columns = React.useMemo<ColumnDef<RequestReportRow>[]>(
    () => [
      {
        accessorKey: "requestDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tgl Permintaan
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>{formatDate(row.getValue("requestDate"))}</span>
          </div>
        ),
      },
      {
        accessorKey: "requestedItem",
        header: "Barang Diminta",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100/70 flex items-center justify-center text-pink-600 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-gray-800 text-xs">
              {row.getValue("requestedItem") || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "store",
        header: "Toko / Unit Cabang",
        cell: ({ row }) => {
          const store = row.getValue("store") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Building2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="truncate max-w-[150px] font-medium">{store || "-"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "requestedQuantity",
        header: "Diminta",
        cell: ({ row }) => {
          const qty = row.getValue("requestedQuantity") as number;
          return (
            <span className="text-xs font-medium text-gray-700">
              {qty ?? 0} Unit
            </span>
          );
        },
      },
      {
        accessorKey: "fulfilledQuantity",
        header: "Dipenuhi",
        cell: ({ row }) => {
          const qty = row.getValue("fulfilledQuantity") as number;
          return (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{qty ?? 0} Unit</span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalPrice",
        header: "Total Nilai",
        cell: ({ row }) => {
          const val = row.getValue("totalPrice") as string;
          return (
            <span className="font-bold text-xs text-rose-600">
              {val || "Rp 0"}
            </span>
          );
        },
      },
      {
        accessorKey: "fulfilledDate",
        header: "Tgl Realisasi",
        cell: ({ row }) => {
          const val = row.getValue("fulfilledDate") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{val ? formatDate(val) : "Belum selesai"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Catatan",
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
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setData([]);

      const sort = sorting[0];
      const sortField = sort?.id ?? "requestDate";
      const sortOrder = sort?.desc ? "desc" : "asc";

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
        search,
        sortField,
        sortOrder,
      });

      const res = await apiFetch(`/reports/request?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat laporan permintaan");
      }

      const mapped: RequestReportRow[] = (json.data || []).map(
        (r: any, idx: number) => ({
          id: `${r.id}-${pageIndex}-${pageSize}-${idx}`,
          requestedItem: r.productName,
          requestedQuantity: r.requestedQuantity,
          fulfilledQuantity: r.fulfilledQuantity,
          requestDate: r.requestDate,
          fulfilledDate: r.fulfilledDate,
          store: r.store,
          unitPrice: formatRupiah(r.unitPrice),
          totalPrice: formatRupiah(r.totalPrice),
          remarks: r.remarks ?? "-",
          supplierLocation: r.supplierLocation ?? "-",
        })
      );

      setData(mapped);
      setTotalCount(json.totalCount ?? 0);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Gagal load request report:", err);
      }
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
              Laporan Permintaan Barang
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
              <FileSpreadsheet className="w-3 h-3 text-pink-500" /> Request Fulfillment Report
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Rekapitulasi seluruh pengajuan barang cabang dan pemenuhan alokasi stok gudang
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
          linkExport="/report-request/export"
          searchPlaceholder="Cari berdasarkan nama barang, toko cabang..."
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
