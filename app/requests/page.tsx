"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 } from "@/components/data-table";

type RequestStatus = "Pending" | "Partial" | "Fulfilled";

interface ProductRequest {
  id: string;
  requestedItem: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  requestDate: string;
  fulfilledDate: string | null;
  store: string;
  unitPrice: number;
  totalPrice: number;
  status: RequestStatus;
}

interface ApiListResponse {
  success: boolean;
  data: {
    id: number;
    requestedItem: string;
    requestedQuantity: number;
    fulfilledQuantity: number;
    requestDate: string;
    fulfilledDate: string | null;
    store: string;
    unitPrice: number;
    totalPrice: number;
    status: RequestStatus;
  }[];
  totalCount: number;
}

const columns: ColumnDef<ProductRequest>[] = [
  {
    accessorKey: "requestedItem",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Requested Item
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "requestedQuantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Requested Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "fulfilledQuantity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Fulfilled Qty
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "requestDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Request Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "fulfilledDate",
    header: "Fulfilled Date",
    cell: ({ row }) => {
      const date = row.getValue("fulfilledDate") as string | null;
      return date || "N/A";
    },
  },
  {
    accessorKey: "store",
    header: "Store",
  },
  {
    accessorKey: "unitPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Unit Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const price = row.getValue("unitPrice") as number;
      return `$${price.toFixed(2)}`;
    },
  },
  {
    accessorKey: "totalPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Total Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const price = row.getValue("totalPrice") as number;
      return `$${price.toFixed(2)}`;
    },
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
  const [sortField, setSortField] = React.useState<string>("requestDate");
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

      const res = await fetch(`/api/product-requests?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch product requests");
      const json: ApiListResponse = await res.json();

      if (!json.success) throw new Error("API error");

      const mapped: ProductRequest[] = (json.data || []).map((r) => ({
        id: String(r.id),
        requestedItem: r.requestedItem,
        requestedQuantity: r.requestedQuantity,
        fulfilledQuantity: r.fulfilledQuantity,
        requestDate: r.requestDate,
        fulfilledDate: r.fulfilledDate,
        store: r.store,
        unitPrice: r.unitPrice,
        totalPrice: r.totalPrice,
        status: r.status,
      }));

      setData(mapped);
      setTotalCount(json.totalCount ?? 0);
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
    router.push(`/requests/${request.id}`);
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
