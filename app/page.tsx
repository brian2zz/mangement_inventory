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
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// pastikan path ini sesuai file DataTableV2 kamu
import { DataTableV2 } from "@/components/data-table";

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

const columns: ColumnDef<DashboardRow>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("date")}</div>,
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Part Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "productName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "stockIn",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock In
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stockIn = row.getValue("stockIn") as number;
      return (
        <Badge variant={stockIn > 0 ? "default" : "secondary"}>
          {stockIn}
        </Badge>
      );
    },
  },
  {
    accessorKey: "stockOut",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Stock Out
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stockOut = row.getValue("stockOut") as number;
      return (
        <Badge variant={stockOut > 0 ? "destructive" : "secondary"}>
          {stockOut}
        </Badge>
      );
    },
  },
  {
    accessorKey: "destination",
    header: "Destination",
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Current Stock
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      const variant =
        stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive";

      return <Badge variant={variant}>{stock}</Badge>;
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
];

export default function Dashboard() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1), // awal tahun
    to: new Date(), // hari ini
  });

  const [data, setData] = React.useState<DashboardRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pageIndex, setPageIndex] = React.useState(0); // 0-based untuk UI
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<
    { id: string; desc: boolean }[]
  >([]);

  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [summary, setSummary] = React.useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalValue: "0.00",
    pendingRequests: 0,
  });

  const fetchData = React.useCallback(async () => {
    if (!dateRange?.from || !dateRange.to) return;

    setLoading(true);

    const sort = sorting[0];
    const sortField = sort?.id ?? "date";
    const sortOrder = sort?.desc ? "desc" : "asc";

    const params = new URLSearchParams();
    params.set("page", String(pageIndex + 1)); // backend pakai 1-based
    params.set("limit", String(pageSize));
    params.set("search", search);
    params.set("sortField", sortField);
    params.set("sortOrder", sortOrder);
    params.set("from", dateRange.from.toISOString());
    params.set("to", dateRange.to.toISOString());

    const res = await fetch(`/api/dashboard/rekap?${params.toString()}`);
    const json = await res.json();

    if (json.success) {
      setData(json.data);
      setTotalCount(json.totalCount);
      setSummary(json.summary);
    } else {
      console.error(json.error);
    }

    setLoading(false);
  }, [pageIndex, pageSize, sorting, dateRange, search]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

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
              ${summary.totalValue}
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
      <div className="enhanced-card p-6">
        <DataTableV2
          columns={columns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={loading}
          searchPlaceholder="Search transactions..."
          haveFilter={false}
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
