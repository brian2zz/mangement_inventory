"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableV2 } from "@/components/data-table";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/utils";

interface RequestReportRow {
  id: string; // 🔥 PENTING: string UNIQUE
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

const columns: ColumnDef<RequestReportRow>[] = [
  { accessorKey: "requestedItem", header: "Requested Item" },
  { accessorKey: "requestedQuantity", header: "Requested Qty" },
  { accessorKey: "fulfilledQuantity", header: "Fulfilled Qty" },
  { accessorKey: "requestDate", header: "Request Date" },
  { accessorKey: "fulfilledDate", header: "Fulfilled Date" },
  { accessorKey: "store", header: "Store" },
  { accessorKey: "unitPrice", header: "Unit Price" },
  { accessorKey: "totalPrice", header: "Total Price" },
  { accessorKey: "remarks", header: "Remarks" },
  { accessorKey: "supplierLocation", header: "Supplier Location" },
];

export default function RequestReportPage() {
  const [data, setData] = React.useState<RequestReportRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<
    { id: string; desc: boolean }[]
  >([{ id: "requestDate", desc: true }]);

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);

  const fetchData = React.useCallback(async () => {
    // 🛑 cancel request sebelumnya
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      setData([]); // 🔥 CLEAR dulu biar tidak terlihat append

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

      const res = await apiFetch(
        `/reports/request?${params.toString()}`,
        {
          method: "GET",
          signal: controller.signal,
        }
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to fetch request report");
      }

      const mapped: RequestReportRow[] = (json.data || []).map(
        (r: any, idx: number) => ({
          // 🔥 KEY PALING PENTING (ANTI APPEND)
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
          supplierLocation: r.supplier ?? "-",
        })
      );

      setData(mapped);
      setTotalCount(json.totalCount);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to fetch request report:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, sorting, search]);

  React.useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
        Request Report
      </h1>

      <div className="enhanced-card p-6">
        <DataTableV2
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilterExport
          linkExport="/report-request/export"
          searchPlaceholder="Search request items..."
          haveFilter={false}
          onPaginationChange={(newPageIndex, newPageSize) => {
            // 🔥 reset page kalau pageSize berubah
            if (newPageSize !== pageSize) {
              setPageIndex(0);
              setPageSize(newPageSize);
            } else {
              setPageIndex(newPageIndex);
            }
          }}
          onSortingChange={(newSorting) => {
            setPageIndex(0);
            setSorting(newSorting);
          }}
          onSearchChange={(value) => {
            setPageIndex(0);
            setSearch(value);
          }}
        />
      </div>
    </div>
  );
}
