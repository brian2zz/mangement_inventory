"use client";

import * as React from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 as DataTable } from "@/components/data-table";

interface IncomingReport {
  id: number;
  date: string;
  productName: string;
  category: string;
  partNumber: string;
  supplier: string;
  warehouse: string;
  quantityIn: number;
  currentStock: number;
  remarks: string;
}

/* ============================
   TABLE COLUMNS
============================ */
const columns: ColumnDef<IncomingReport>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Product Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Category <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Part Number <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Supplier <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "warehouse",
    header: "Destination",
  },
  {
    accessorKey: "quantityIn",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Quantity In <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <Badge>{row.getValue("quantityIn")}</Badge>,
  },
  {
    accessorKey: "currentStock",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Current Stock <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const value = row.getValue("currentStock") as number;
      return (
        <Badge variant={value > 50 ? "default" : value > 20 ? "secondary" : "destructive"}>
          {value}
        </Badge>
      );
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
];

/* ============================
   MAIN PAGE
============================ */
export default function IncomingProductReportPage() {
  const [data, setData] = React.useState<IncomingReport[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  // Table state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [search, setSearch] = React.useState("");

  const [loading, setLoading] = React.useState(true);

  async function loadData() {
    setLoading(true);

    const query = new URLSearchParams({
      page: (pageIndex + 1).toString(),
      limit: pageSize.toString(),
      search,
      sortField: sorting[0]?.id ?? "date",
      sortOrder: sorting[0]?.desc ? "desc" : "asc",
    });

    const res = await fetch(`/api/reports/incoming?${query}`);
    const json = await res.json();

    if (json.success) {
      setData(json.data);
      setTotalCount(json.totalCount ?? 0);
    }

    setLoading(false);
  }

  React.useEffect(() => {
    loadData();
  }, [pageIndex, pageSize, search, sorting]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Incoming Product Report</h1>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        totalCount={totalCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
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
  );
}
