"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { DataTableV2 as DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, PackagePlus, ArrowUpDown, Calendar, Building2, Warehouse as WarehouseIcon, Layers } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface IncomingRow {
  id: number;
  transactionDate: string;
  supplier: string;
  warehouse: string;
  notes: string;
  status: "Draft" | "Done";
  totalItems: number;
  totalValue: number;
}

export default function IncomingPage() {
  const router = useRouter();

  // Table state
  const [data, setData] = useState<IncomingRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "transactionDate", desc: true }
  ]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any[]>([]);

  // Filter configuration
  const fields: FieldOption[] = [
    { name: "transactionDate", label: "Tanggal Transaksi", type: "date" },
    { name: "supplier", label: "Supplier", type: "string" },
    { name: "warehouse", label: "Warehouse", type: "string" },
    { name: "status", label: "Status", type: "string" },
    { name: "totalItems", label: "Total Items", type: "number" },
  ];

  const fetchData = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      limit: String(pageSize),
      search,
      sortField: sorting[0]?.id ?? "transactionDate",
      sortOrder: sorting[0]?.desc ? "desc" : "asc",
    });

    if (filters.length > 0) {
      params.append("filters", JSON.stringify(filters));
    }

    try {
      const res = await apiFetch(`/incoming-transactions?${params.toString()}`, {
        method: "GET",
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      setData(json.data);
      setTotalCount(json.totalCount);
    } catch (err) {
      console.error("❌ Error fetching incoming:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, sorting, filters]);

  
  const columns = useMemo<ColumnDef<IncomingRow>[]>(() => [
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
          #IN-{String(row.getValue("id")).padStart(4, "0")}
        </span>
      ),
    },
    {
      accessorKey: "transactionDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-pink-50 text-gray-700 font-semibold p-0 h-auto"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal Masuk
          <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-pink-400" />
          <span>{formatDate(row.getValue("transactionDate"))}</span>
        </div>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Pemasok (Supplier)",
      cell: ({ row }) => {
        const supplier = row.getValue("supplier") as string;
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-100/70 flex items-center justify-center text-pink-600 shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-gray-800 text-xs truncate max-w-[200px]">
              {supplier || "-"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "warehouse",
      header: "Gudang Tujuan",
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
        const items = Number(row.getValue("totalItems")) || 0;
        return (
          <span className="text-xs font-bold text-gray-800">
            {items} Unit
          </span>
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
  ], []);

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-pink-100/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Incoming Products
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700">
              <PackagePlus className="w-3 h-3 text-emerald-500" /> Barang Masuk
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Catatan penerimaan stok barang dari vendor dan alokasi penyimpanan gudang
          </p>
        </div>

        <Button asChild className="btn-gradient border-0 rounded-full px-5 shadow-sm text-xs font-semibold self-end sm:self-auto">
          <Link href="/incoming/add">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Catat Barang Masuk
          </Link>
        </Button>
      </div>

      {/* DataTable */}
      <div className="enhanced-card overflow-hidden">
        <div className="px-6 py-4 border-b border-pink-100/60 bg-gradient-to-r from-pink-50/50 via-rose-50/20 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-100/70 text-pink-600">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Histori Transaksi Penerimaan</h2>
              <p className="text-xs text-gray-500">Klik baris transaksi untuk melihat rincian produk yang diterima</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-pink-100/70 text-pink-700">
            {totalCount} Total Transaksi
          </span>
        </div>

        <div className="p-6">
          <DataTable
            columns={columns}
            data={data}
            totalCount={totalCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            loading={loading}
            haveFilter
            haveFilterExport={true}
            linkExport="/incoming-transactions/export"
            filterComponent={
              <FilterBuilder
                fields={fields}
                value={filters}
                onApply={(val) => {
                  setFilters(val);
                  setPageIndex(0);
                }}
              />
            }
            onPaginationChange={(p, ps) => {
              setPageIndex(p);
              setPageSize(ps);
            }}
            onSortingChange={setSorting}
            onSearchChange={(v) => {
              setSearch(v);
              setPageIndex(0);
            }}
            onRowClick={(row) => router.push(`/incoming?id=${row.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
