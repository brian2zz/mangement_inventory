"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableV2 } from "@/components/data-table";

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

const columns: ColumnDef<OutgoingReportRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "productName",
    header: "Product Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "partNumber",
    header: "Part Number",
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "destination",
    header: "Destination",
  },
  {
    accessorKey: "quantityOut",
    header: "Quantity Out",
  },
  {
    accessorKey: "currentStock",
    header: "Current Stock",
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
];

export default function OutgoingProductReportPage() {
  const [data, setData] = React.useState<OutgoingReportRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pageIndex, setPageIndex] = React.useState(0); // 0-based untuk UI
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<
    { id: string; desc: boolean }[]
  >([]);
  const [search, setSearch] = React.useState("");

  const [loading, setLoading] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);

      const sort = sorting[0];
      const sortField = sort?.id || "date";
      const sortOrder = sort?.desc ? "desc" : "asc";

      const params = new URLSearchParams();
      params.set("page", String(pageIndex + 1)); // API pakai 1-based
      params.set("limit", String(pageSize));
      params.set("search", search);
      params.set("sortField", sortField);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/reports/outgoing?${params.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to fetch");
      }

      setData(json.data);
      setTotalCount(json.totalCount);
    } catch (error) {
      console.error("Failed to fetch outgoing report:", error);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, sorting, search]);

  // Trigger fetch ketika dependency berubah
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Outgoing Product Report
        </h1>
      </div>

      <div className="enhanced-card p-6">
        <DataTableV2
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          searchPlaceholder="Search outgoing products..."
          haveFilter={false}
          onRowClick={(row) => {
            // opsional: misal buka detail
            console.log("Row clicked:", row);
          }}
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex);
            setPageSize(newPageSize);
          }}
          onSortingChange={(newSorting) => {
            setSorting(newSorting);
          }}
          onSearchChange={(value) => {
            setPageIndex(0); // reset ke halaman pertama kalau search berubah
            setSearch(value);
          }}
        />
      </div>
    </div>
  );
}
