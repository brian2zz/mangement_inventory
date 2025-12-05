"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableV2 } from "@/components/data-table";

interface RequestReportRow {
  id: number;
  requestedItem: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  requestDate: string;
  fulfilledDate: string;
  store: string;
  unitPrice: number;
  totalPrice: number;
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
  >([]);

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setLoading(true);

    const sort = sorting[0];
    const sortField = sort?.id ?? "requestDate";
    const sortOrder = sort?.desc ? "desc" : "asc";

    const params = new URLSearchParams();
    params.set("page", String(pageIndex + 1));
    params.set("limit", String(pageSize));
    params.set("search", search);
    params.set("sortField", sortField);
    params.set("sortOrder", sortOrder);

    const res = await fetch(`/api/reports/request?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      setData(json.data);
      setTotalCount(json.totalCount);
    }

    setLoading(false);
  }, [pageIndex, pageSize, sorting, search]);

  React.useEffect(() => {
    fetchData();
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
          searchPlaceholder="Search request items..."
          haveFilter={false}
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex);
            setPageSize(newPageSize);
          }}
          onSortingChange={(s) => setSorting(s)}
          onSearchChange={(value) => {
            setPageIndex(0);
            setSearch(value);
          }}
        />
      </div>
    </div>
  );
}
