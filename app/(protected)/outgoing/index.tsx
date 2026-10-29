"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, SortingState } from "@tanstack/react-table";

import { DataTableV2 as DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Plus,
  AlertCircle,
  Truck,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpDown,
  Warehouse as WarehouseIcon,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface OutgoingRow {
  id: number;
  transaction_date: string;
  warehouse: string;
  customer: string;
  notes: string;
  status: "Draft" | "Done";
  totalItems: number;
  totalValue: number;
}

export default function OutgoingProductsPage() {
  const router = useRouter();

  // TABLE STATE
  const [data, setData] = useState<OutgoingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "transaction_date", desc: true },
  ]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any[]>([]);

  // FILTER FIELDS
  const fields: FieldOption[] = [
    { name: "transaction_date", label: "Tanggal Pengeluaran", type: "date" },
    { name: "warehouse", label: "Gudang Asal", type: "string" },
    { name: "customer", label: "Customer / Penerima", type: "string" },
    { name: "status", label: "Status Dokumen", type: "string" },
    { name: "notes", label: "Catatan", type: "string" },
  ];

  // GET DATA
  const fetchData = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        search,
        sortField: sorting[0]?.id ?? "transaction_date",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      });

      if (filters?.length > 0) {
        params.append("filters", JSON.stringify(filters));
      }

      const res = await apiFetch(`/outgoing-transactions?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unknown error");

      setData(json.data || []);
      setTotalCount(json.totalCount ?? 0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Gagal memuat data transaksi keluar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, sorting, filters]);

  
  // TABLE COLUMNS
  const columns = useMemo<ColumnDef<OutgoingRow>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. Dokumen
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-pink-50/80 text-pink-700 border border-pink-200/60 shadow-xs">
            #OUT-{String(row.getValue("id")).padStart(4, "0")}
          </span>
        ),
      },
      {
        accessorKey: "transaction_date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tanggal Keluar
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>{formatDate(row.getValue("transaction_date"))}</span>
          </div>
        ),
      },
      {
        accessorKey: "customer",
        header: "Customer (Penerima)",
        cell: ({ row }) => {
          const customer = row.getValue("customer") as string;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-100/70 flex items-center justify-center text-pink-600 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-gray-800 text-xs truncate max-w-[200px]">
                {customer || "-"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "warehouse",
        header: "Gudang Asal",
        cell: ({ row }) => {
          const warehouse = row.getValue("warehouse") as string;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <WarehouseIcon className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-medium">{warehouse || "-"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalItems",
        header: "Total Unit",
        cell: ({ row }) => {
          const items = row.getValue("totalItems") as number;
          return (
            <div className="flex items-center justify-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span className="font-bold text-gray-900 text-xs">{items ?? 0} Unit</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          const isDone = status === "Done";
          return (
            <Badge
              className={
                isDone
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5"
                  : "bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-xs px-2.5 py-0.5"
              }
            >
              {isDone ? "SELESAI (DONE)" : "DRAFT"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "notes",
        header: "Catatan",
        cell: ({ row }) => {
          const notes = row.getValue("notes") as string;
          if (!notes || notes === "-" || notes.trim() === "") {
            return <span className="text-gray-300">-</span>;
          }
          return (
            <span className="text-xs text-gray-700 whitespace-normal break-words leading-relaxed">
              {notes}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Barang Keluar
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100/70 text-rose-700">
              <Truck className="w-3 h-3 text-rose-500" /> Pengiriman & Distribusi
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kelola pengeluaran stok barang untuk penjualan ke customer atau transfer gudang
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

          <Button asChild className="btn-gradient shadow-md rounded-full px-4 text-xs font-semibold">
            <Link href="/outgoing/add">
              <Plus className="mr-1.5 h-4 w-4" />
              Catat Barang Keluar
            </Link>
          </Button>
        </div>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl flex gap-3 text-red-700 text-sm shadow-xs items-center">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="border-red-200 text-red-700 hover:bg-red-100/50 rounded-full text-xs"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* TABLE */}
      <div className="enhanced-card p-4 sm:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilter
          haveFilterExport={true}
          linkExport="/outgoing-transactions/export"
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
          onPaginationChange={(pi, ps) => {
            setPageIndex(pi);
            setPageSize(ps);
          }}
          onSortingChange={setSorting}
          onSearchChange={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          onRowClick={(row) => router.push(`/outgoing?id=${row.id}`)}
        />
      </div>
    </div>
  );
}
