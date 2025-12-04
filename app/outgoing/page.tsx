"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, SortingState } from "@tanstack/react-table";

import { DataTableV2 as DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder";

interface OutgoingRow {
  id: number;
  transactionDate: string;
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<any[]>([]);

  // FILTER FIELDS
  const fields: FieldOption[] = [
    { name: "transactionDate", label: "Tanggal", type: "date" },
    { name: "warehouse", label: "Warehouse", type: "string" },
    { name: "customer", label: "Customer", type: "string" },
    { name: "status", label: "Status", type: "string" },
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
        sortField: sorting[0]?.id ?? "transactionDate",
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
      });

      if (filters?.length > 0) {
        params.append("filters", JSON.stringify(filters));
      }

      const res = await fetch(`/api/outgoing-transactions?${params.toString()}`);

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Unknown error");

      setData(json.data);
      setTotalCount(json.totalCount ?? 0);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, search, sorting, filters]);

  // TABLE COLUMNS
  const columns = useMemo<ColumnDef<OutgoingRow>[]>(() => [
    { accessorKey: "transactionDate", header: "Date" },
    { accessorKey: "warehouse", header: "Warehouse" },
    { accessorKey: "customer", header: "Customer" },
    { accessorKey: "totalItems", header: "Items" },
    { accessorKey: "notes", header: "Notes" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`px-2 py-1 rounded text-white ${status === "Done" ? "bg-green-600" : "bg-gray-500"}`}>
            {status}
          </span>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Outgoing Products
        </h1>

        <Button asChild className="btn-gradient">
          <Link href="/outgoing/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Outgoing
          </Link>
        </Button>
      </div>

      {/* ERROR */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded flex gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">{errorMessage}</div>
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            Retry
          </Button>
        </div>
      )}

      {/* TABLE */}
      <div className="enhanced-card p-6">
        <DataTable
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          haveFilter
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
          onRowClick={(row) => router.push(`/outgoing/${row.id}`)}
        />
      </div>
    </div>
  );
}
