"use client";

import * as React from "react";
import { type ColumnDef, flexRender } from "@tanstack/react-table";
import { ChevronDown, Download, Printer, Search, Filter, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { format, subYears } from "date-fns";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  loading?: boolean;
  searchPlaceholder?: string;
  haveFilter?: boolean;
  filterComponent?: React.ReactNode;
  sorting?: { id: string; desc: boolean }[]
  onRowClick?: (row: TData) => void;
  onPaginationChange: (newPageIndex: number, newPageSize: number) => void;
  onSortingChange: (sorting: { id: string; desc: boolean }[]) => void;
  onSearchChange: (value: string) => void;
  linkExport?: string;
  haveFilterExport?: boolean;
  filterExport?: {
    productId?: string | number;
    [key: string]: any;
  };
}

export function DataTableV2<TData, TValue>({
  columns,
  data,
  totalCount,
  pageIndex,
  pageSize,
  loading = false,
  searchPlaceholder = "Search...",
  haveFilter = false,
  haveFilterExport = false,
  filterComponent,
  filterExport,
  linkExport,
  sorting,
  onRowClick,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const [search, setSearch] = React.useState("");
  const [showFilter, setShowFilter] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(columns.map((c) => String(c.accessorKey)));
  // const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([]);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [pageInput, setPageInput] = React.useState(pageIndex + 1);

  React.useEffect(() => {
    setPageInput(pageIndex + 1);
  }, [pageIndex]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 🔎 Debounced search
  React.useEffect(() => {
    const timeout = setTimeout(() => onSearchChange(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  const [dateRange, setDateRange] = React.useState<{
    from: Date;
    to: Date;
  }>({
    from: subYears(new Date(), 1), // ⏪ default 1 tahun ke belakang
    to: new Date(),
  });

  // 📤 Export ke Excel
  const exportToExcel = (range: { from: Date; to: Date }) => {
    if (!linkExport) return

    let url = `${process.env.NEXT_PUBLIC_API_URL}${linkExport}`

    // 🔹 ambil sorting dari table (kalau ada)
    const sortField = sorting?.[0]?.id ?? "id"
    const sortOrder = sorting?.[0]?.desc ? "desc" : "asc"

    const params = new URLSearchParams({
      search: search ?? "",
      sortField,
      sortOrder,
    })

    // 🔑 PRIORITY: filterExport
    if (filterExport && Object.keys(filterExport).length > 0) {
      Object.entries(filterExport).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value))
        }
      })
    }

    // 📅 filter tanggal (optional)
    if (haveFilterExport) {
      params.append("from", range.from.toISOString().slice(0, 10))
      params.append("to", range.to.toISOString().slice(0, 10))
    }

    url += `?${params.toString()}`
    console.log("Export URL:", url)
    window.open(url, "_blank")
  }

  const normalizeDateRange = (range: { from: Date; to: Date }) => {
    const from = new Date(range.from);
    from.setHours(0, 0, 0, 0);

    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999);

    return { from, to };
  };

  // 🖨️ Print 
  const printTable = () => window.print();

  // 🧮 Sorting toggle
  const handleSortClick = (accessorKey: string) => {
    const current = sorting[0];
    let newSorting;
    if (!current || current.id !== accessorKey) {
      newSorting = [{ id: accessorKey, desc: false }];
    } else {
      newSorting = [{ id: accessorKey, desc: !current.desc }];
    }

    onSortingChange(newSorting);
  };

  const handleJumpToPage = (value: number) => {
    if (Number.isNaN(value)) return;

    const page = Math.min(Math.max(value, 1), totalPages);
    onPaginationChange(page - 1, pageSize);
  };

  // 🌈 UI helper
  const renderSortIcon = (accessorKey: string) => {
    const current = sorting?.[0];
    if (!current || current.id !== accessorKey) return null;

    return current.desc
      ? <ArrowDown className="inline ml-1 h-3 w-3" />
      : <ArrowUp className="inline ml-1 h-3 w-3" />;
  };

  return (
    <div className="w-full">
      {/* 🔍 Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-pink-400" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 max-w-sm gradient-input focus:ring-pink-200"
            />
          </div>

          {haveFilter && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 bg-white/80 hover:bg-pink-50 border-pink-200 text-gray-700 hover:text-gray-900"
                onClick={() => setShowFilter(true)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>

              {showFilter &&
                React.isValidElement(filterComponent) &&
                React.cloneElement(filterComponent as React.ReactElement<any>, {
                  open: showFilter,
                  setOpen: setShowFilter,
                })}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="btn-gradient border-0"
            onClick={() => {
              if (haveFilterExport) {
                setExportOpen(true); // buka popup
              } else {
                exportToExcel(dateRange); // langsung download
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={printTable} className="btn-gradient border-0">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto bg-white/80 hover:bg-pink-50 border-pink-200 text-gray-700 hover:text-gray-900"
              >
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-pink-200">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={String(column.accessorKey)}
                  className="capitalize hover:bg-pink-50"
                  checked={visibleColumns.includes(String(column.accessorKey))}
                  onCheckedChange={(checked) => {
                    setVisibleColumns((prev) =>
                      checked
                        ? [...prev, String(column.accessorKey)]
                        : prev.filter((c) => c !== String(column.accessorKey))
                    );
                  }}
                >
                  {String(column.accessorKey)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 🏷 Table */}
      <div className="gradient-table overflow-x-auto rounded-xl border border-pink-100">
        <Table>
          <TableHeader>
            <TableRow className="border-pink-100 bg-gradient-to-r from-pink-50 to-rose-50">
              {columns
                .filter((col) => visibleColumns.includes(String(col.accessorKey)))
                .map((col) => (
                  <TableHead
                    key={String(col.accessorKey)}
                    className="font-semibold text-gray-700 cursor-pointer select-none"
                    onClick={() => handleSortClick(String(col.accessorKey))}
                  >
                    {flexRender(col.header, {})}
                    {renderSortIcon(String(col.accessorKey))}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns
                    .filter((col) => visibleColumns.includes(String(col.accessorKey)))
                    .map((col) => (
                      <TableCell key={String(col.accessorKey)}>
                        <div className="h-4 w-3/4 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded" />
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : data.length > 0 ? (
              data.map((row: any) => (
                <TableRow
                  key={row.id}
                  className={`border-pink-100 transition-colors hover:bg-pink-50 ${onRowClick ? "cursor-pointer" : ""
                    }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns
                    .filter((col) => visibleColumns.includes(String(col.accessorKey)))
                    .map((col) => (
                      <TableCell
                        key={String(col.accessorKey)}
                        className="whitespace-normal break-words max-w-[300px]"
                      >
                        {row[col.accessorKey as string] ?? "-"}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-gray-500 select-none"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-sm">✨ No results found</span>
                    <span className="text-xs text-gray-400">Try adjusting search or filters</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 📑 Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-600">Rows per page</p>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPaginationChange(pageIndex, Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px] gradient-input">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-white/95 backdrop-blur-sm border-pink-200">
              {[10, 20, 30, 40, 50].map((ps) => (
                <SelectItem key={ps} value={String(ps)} className="hover:bg-pink-50">
                  {ps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Page
          </span>

          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(Number(e.target.value))}
            onBlur={() => handleJumpToPage(pageInput)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleJumpToPage(pageInput);
              }
            }}
            className="h-8 w-[70px] text-center gradient-input"
          />

          <span className="text-sm text-gray-600">
            of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 hover:bg-pink-50 border-pink-200"
            onClick={() => onPaginationChange(Math.max(0, pageIndex - 1), pageSize)}
            disabled={pageIndex === 0}
          >
            {"<"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-white/80 hover:bg-pink-50 border-pink-200"
            onClick={() => onPaginationChange(pageIndex + 1, pageSize)}
            disabled={pageIndex + 1 >= totalPages}
          >
            {">"}
          </Button>
        </div>
      </div>
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent
          className="
          fixed
          top-[5vh]
          left-1/2
          translate-x-[-50%]
          translate-y-0

          max-w-5xl
          w-full
          max-h-[90vh]
          overflow-y-auto
        "
          style={{
            maxWidth: "600px",
          }}
        >
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Pilih rentang tanggal data yang ingin diexport
            </div>

            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                defaultMonth={dateRange.from}
                numberOfMonths={2}
              />
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>
                From:{" "}
                <b>{format(dateRange.from, "dd MMM yyyy")}</b>
              </span>
              <span>
                To:{" "}
                <b>{format(dateRange.to, "dd MMM yyyy")}</b>
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setExportOpen(false)}>
                Cancel
              </Button>
              <Button
                className="btn-gradient"
                onClick={() => {
                  exportToExcel(dateRange);
                  setExportOpen(false);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
