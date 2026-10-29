"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Calendar,
  Package,
  AlertTriangle,
  DollarSign,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { DataTableV2 } from "@/components/data-table";
import { useRequireAuth } from "@/components/use-require-auth";
import { formatRupiah } from "@/lib/utils";

/* =======================
   TYPES
======================= */
interface DashboardRow {
  id: string;
  date: string;
  partNumber: string;
  productName: string;
  source: string;
  stockIn: number;
  stockOut: number;
  destination: string;
  stock: number;
  remarks: string;
}

/* =======================
   COLUMNS (TIDAK DIUBAH)
======================= */
const columns: ColumnDef<DashboardRow>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs p-0 font-semibold"
      >
        Date
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-xs whitespace-nowrap">{formatDate(row.getValue("date"))}</div>,
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs p-0 font-semibold"
      >
        Part Number
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-xs text-gray-700 max-w-[140px] break-words">
        {row.getValue("partNumber") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs p-0 font-semibold"
      >
        Product Name
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-semibold text-xs text-gray-800 max-w-[200px] break-words leading-snug">
        {row.getValue("productName") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <div className="text-xs text-gray-700 max-w-[140px] break-words">
        {row.getValue("source") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "stockIn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs p-0 font-semibold"
      >
        Stock In
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = Number(row.getValue("stockIn")) || 0;
      return val > 0 ? (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
          {val}
        </span>
      ) : (
        <span className="text-gray-400 text-xs">0</span>
      );
    },
  },
  {
    accessorKey: "stockOut",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs p-0 font-semibold"
      >
        Stock Out
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const val = Number(row.getValue("stockOut")) || 0;
      return val > 0 ? (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">
          {val}
        </span>
      ) : (
        <span className="text-gray-400 text-xs">0</span>
      );
    },
  },
  {
    accessorKey: "destination",
    header: "Destination",
    cell: ({ row }) => (
      <div className="text-xs text-gray-700 max-w-[180px] break-words leading-snug">
        {row.getValue("destination") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="text-xs p-0 font-semibold"
      >
        Current Stock
        <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = Number(row.getValue("stock")) || 0;
      return (
        <span className="text-xs font-bold text-gray-800">
          {stock}
        </span>
      );
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) => {
      const val = row.getValue("remarks") as string;
      if (!val || val === "-" || val.trim() === "") {
        return <span className="text-gray-300">-</span>;
      }
      return (
        <div className="text-xs text-gray-600 max-w-[220px] break-words leading-relaxed whitespace-normal">
          {val}
        </div>
      );
    },
  },
];

/* =======================
   COMPONENT
======================= */
export default function Dashboard() {
  /* 🔴 AUTH WAJIB DI ATAS */
  const { user, isLoading } = useRequireAuth();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const [data, setData] = React.useState<DashboardRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [sorting, setSorting] = React.useState([{ id: "date", desc: true }]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [summary, setSummary] = React.useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: "0.00",
    pendingRequests: 0,
  });

  /* =======================
     FETCH DATA (FIXED)
  ======================= */
  const fetchData = React.useCallback(async () => {
    if (!user) return;
    if (!dateRange?.from || !dateRange.to) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);

    try {
      const sort = sorting[0];
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
        search,
        sortField: sort?.id ?? "date",
        sortOrder: sort?.desc ? "desc" : "asc",
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/dashboard/rekap?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("Dashboard fetch failed");

      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setTotalCount(json.totalCount);
        setSummary(json.summary);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, pageIndex, pageSize, sorting, dateRange, search]);

  /* 🔴 FETCH HANYA SETELAH AUTH SIAP */
  React.useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    fetchData();
  }, [fetchData, isLoading, user]);

  /* =======================
     AUTH GUARD
  ======================= */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  /* =======================
     RENDER (TIDAK DIUBAH)
  ======================= */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER + DATE RANGE FILTER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Dashboard
        </h1>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-[300px] justify-start text-left font-normal btn-gradient border-0"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-sm border-pink-200" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range);
                  setPageIndex(0); // reset ke page pertama kalau ganti range
                }}
                numberOfMonths={2}
                className="text-gray-700"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              Total Products
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              {Intl.NumberFormat().format(summary.totalProducts)}
            </div>
            <p className="text-xs text-gray-500">
              Total products in the system
            </p>
          </div>
        </div>

        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              Low Stock Items
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {summary.lowStockItems}
            </div>
            <p className="text-xs text-gray-500">
              Below reorder level
            </p>
          </div>
        </div>

        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Value</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {formatRupiah(Number(summary.totalValue))}
            </div>
            <p className="text-xs text-gray-500">
              Current inventory value
            </p>
          </div>
        </div>

        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">
              Pending Requests
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {summary.pendingRequests}
            </div>
            <p className="text-xs text-gray-500">
              Waiting for fulfillment
            </p>
          </div>
        </div>
      </div>

      {/* TABLE REKAP */}
      <div className="enhanced-card p-3 sm:p-6 w-full max-w-full overflow-hidden">
        <DataTableV2
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          searchPlaceholder="Search transactions..."
          haveFilter={false}
          haveFilterExport={true}
          linkExport="/dashboard/rekap/export"
          onPaginationChange={(newPageIndex, newPageSize) => {
            setPageIndex(newPageIndex);
            setPageSize(newPageSize);
          }}
          onSortingChange={(newSorting) => {
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
