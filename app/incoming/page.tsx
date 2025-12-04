"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef, type SortingState } from "@tanstack/react-table";
import { DataTableV2 as DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

import { FilterBuilder, type FieldOption } from "@/components/filters/FilterBuilder";

interface IncomingRow {
  id: number;
  transactionDate: string;
  supplier: string;
  warehouse: string;
  notes: string;
  submitStatus: "Draft" | "Done";
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
  const [sorting, setSorting] = useState<SortingState>([]);
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
      const res = await fetch(`/api/incoming-transactions?${params.toString()}`);
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
    { accessorKey: "id", header: "ID" },
    { accessorKey: "transactionDate", header: "Date" },
    { accessorKey: "supplier", header: "Supplier" },
    { accessorKey: "warehouse", header: "Warehouse" },
    { accessorKey: "totalItems", header: "Items" },
    { accessorKey: "submitStatus", header: "Status" },
  ], []);

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Incoming Transactions
        </h1>

        <Button asChild className="btn-gradient border-0">
          <Link href="/incoming/add">
            <Plus className="mr-2 h-4 w-4" /> Add Incoming
          </Link>
        </Button>
      </div>

      {/* DataTable */}
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
          onRowClick={(row) => router.push(`/incoming/${row.id}`)}
        />
      </div>
    </div>
  );
}
