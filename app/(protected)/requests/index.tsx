"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Plus,
  Calendar,
  Building2,
  Layers,
  Sparkles,
  ClipboardList,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 } from "@/components/data-table";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { formatRupiah } from "@/lib/utils";

type RequestStatus = "Pending" | "Partial" | "Fulfilled";

interface ProductRequest {
  id: string;
  requestDate: string;
  fulfilledDate: string | null;
  store: string;
  supplier?: string | null;
  totalRequestedQuantity: number;
  totalFulfilledQuantity: number;
  totalPrice: string;
  status: RequestStatus;
}

interface ApiListResponse {
  success: boolean;
  data: {
    id: string;
    requestDate: string;
    fulfilledDate: string | null;
    store: string;
    supplier?: string | null;
    totalRequestedQuantity: number;
    totalFulfilledQuantity: number;
    totalPrice: number;
    status: RequestStatus;
  }[];
  totalCount: number;
}

export default function ProductRequestsPage() {
  const router = useRouter();

  const [data, setData] = React.useState<ProductRequest[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [sortField, setSortField] = React.useState<string>("request_date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  
  const columns = React.useMemo<ColumnDef<ProductRequest>[]>(
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
            No. Permintaan
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-pink-500" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-pink-50/80 text-pink-700 border border-pink-200/60 shadow-xs">
            #REQ-{String(row.getValue("id")).padStart(4, "0")}
          </span>
        ),
      },
      {
        accessorKey: "requestDate",
        header: "Tgl Permintaan",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
            <Calendar className="w-3.5 h-3.5 text-pink-400" />
            <span>{formatDate(row.getValue("requestDate"))}</span>
          </div>
        ),
      },
      {
        accessorKey: "fulfilledDate",
        header: "Tgl Dipenuhi",
        cell: ({ row }) => {
          const val = row.getValue("fulfilledDate") as string | null;
          return (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{val ? formatDate(val) : "Belum selesai"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "store",
        header: "Toko / Unit Cabang",
        cell: ({ row }) => {
          const store = row.getValue("store") as string;
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-100/70 flex items-center justify-center text-pink-600 shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-gray-800 text-xs truncate max-w-[200px]">
                {store || "-"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalRequestedQuantity",
        header: "Diminta",
        cell: ({ row }) => {
          const qty = row.getValue("totalRequestedQuantity") as number;
          return (
            <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>{qty ?? 0} Unit</span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalFulfilledQuantity",
        header: "Dipenuhi",
        cell: ({ row }) => {
          const qty = row.getValue("totalFulfilledQuantity") as number;
          return (
            <div className="flex items-center gap-1 text-xs font-bold text-gray-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{qty ?? 0} Unit</span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalPrice",
        header: () => <div className="text-center w-full">Total Nilai</div>,
        cell: ({ row }) => {
          const val = row.getValue("totalPrice") as string;
          return (
            <span className="font-bold text-xs text-pink-600">
              {val || "Rp 0"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as RequestStatus;
          if (status === "Fulfilled") {
            return (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                TERPENUHI (FULFILLED)
              </Badge>
            );
          }
          if (status === "Partial") {
            return (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
                SEBAGIAN (PARTIAL)
              </Badge>
            );
          }
          return (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none font-semibold text-xs px-2.5 py-0.5">
              PENDING
            </Badge>
          );
        },
      },
    ],
    []
  );

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageIndex + 1));
      params.set("limit", String(pageSize));
      if (search) params.set("search", search);
      if (sortField) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
      }

      const res = await apiFetch(`/product-requests?${params.toString()}`, {
        method: "GET",
      });

      if (!res.ok) throw new Error("Gagal memuat data permintaan produk");

      const json: ApiListResponse = await res.json();
      if (!json.success) throw new Error("API error");

      const mapped: ProductRequest[] = (json.data || []).map((r) => ({
        id: r.id,
        requestDate: r.requestDate,
        fulfilledDate: r.fulfilledDate,
        store: r.store,
        supplier: r.supplier,
        totalRequestedQuantity: r.totalRequestedQuantity,
        totalFulfilledQuantity: r.totalFulfilledQuantity,
        totalPrice: formatRupiah(r.totalPrice),
        status: r.status,
      }));

      setData(mapped);
      setTotalCount(json.totalCount || 0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, search, sortField, sortOrder]);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRowClick = (request: ProductRequest) => {
    router.push(`/requests?id=${request.id}`);
  };

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-4 sm:p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Permintaan Barang
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-100/70 text-pink-700">
              <ClipboardList className="w-3 h-3 text-pink-500" /> Unit Store Requests
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Daftar pengajuan kebutuhan stok barang dari toko cabang dan monitoring pemenuhannya
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={loading}
            className="rounded-full bg-white/80 hover:bg-white border-pink-200 text-gray-600 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin text-pink-500" : ""}`} />
            Refresh
          </Button>

          <Button asChild className="btn-gradient shadow-md rounded-full px-4 text-xs font-semibold">
            <Link href="/requests/add">
              <Plus className="mr-1.5 h-4 w-4" />
              Buat Permintaan Baru
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
            onClick={fetchRequests}
            className="border-red-200 text-red-700 hover:bg-red-100/50 rounded-full text-xs"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* TABLE CARD */}
      <div className="enhanced-card p-4 sm:p-6 overflow-hidden">
        <DataTableV2
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilterExport={true}
          linkExport="/product-requests/export"
          searchPlaceholder="Cari permintaan berdasarkan toko, status, catatan..."
          haveFilter={false}
          onSearchChange={(value) => {
            setPageIndex(0);
            setSearch(value);
          }}
          onPaginationChange={(newPage, newSize) => {
            setPageIndex(newPage);
            setPageSize(newSize);
          }}
          onSortingChange={(sorting: any) => {
            if (!sorting || !sorting.length) return;
            const first = sorting[0];
            setSortField(first.id as string);
            setSortOrder(first.desc ? "desc" : "asc");
          }}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
