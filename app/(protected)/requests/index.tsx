"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 } from "@/components/data-table";
import { apiFetch } from "@/lib/api";
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

const columns: ColumnDef<ProductRequest>[] = [
  {
    accessorKey: "requestDate",
    header: "Request Date",
  },
  {
    accessorKey: "fulfilledDate",
    header: "Fulfilled Date",
    cell: ({ row }) =>
      (row.getValue("fulfilledDate") as string | null) ?? "N/A",
  },
  {
    accessorKey: "store",
    header: "Store",
  },
  {
    accessorKey: "totalRequestedQuantity",
    header: "Total Requested Qty",
  },
  {
    accessorKey: "totalFulfilledQuantity",
    header: "Total Fulfilled Qty",
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as RequestStatus;
      const variant =
        status === "Fulfilled"
          ? "default"
          : status === "Partial"
            ? "secondary"
            : "destructive";

      return <Badge variant={variant}>{status}</Badge>;
    },
  },
];

export default function ProductRequestsPage() {
  const router = useRouter();

  const [data, setData] = React.useState<ProductRequest[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // sort state untuk kirim ke backend (optional)
  const [sortField, setSortField] =
    React.useState<string>("request_date");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageIndex + 1));
      params.set("limit", String(pageSize));
      if (search) params.set("search", search);
      if (sortField) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
      }

      const res = await apiFetch(
        `/product-requests?${params.toString()}`,
        { method: "GET" }
      );

      if (!res.ok) throw new Error("Failed to fetch product requests");

      const json: ApiListResponse = await res.json();
      if (!json.success) throw new Error("API error");

      const mapped: ProductRequest[] = json.data.map((r) => ({
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
      setTotalCount(json.totalCount);
    } catch (err) {
      console.error("Failed to fetch product requests:", err);
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
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Product Requests
        </h1>
        <Button asChild className="btn-gradient border-0">
          <Link href="/requests/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Request
          </Link>
        </Button>
      </div>

      {/* TABLE CARD */}
      <div className="enhanced-card p-6">
        <DataTableV2
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilterExport={true}
          linkExport="/product-requests/export"
          searchPlaceholder="Search requests..."
          haveFilter={false}
          onSearchChange={(value) => {
            setPageIndex(0);
            setSearch(value);
          }}
          onPaginationChange={(newPage, newSize) => {
            setPageIndex(newPage);
            setPageSize(newSize);
          }}
          // asumsikan onSortingChange pakai SortingState (tanstack)
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


