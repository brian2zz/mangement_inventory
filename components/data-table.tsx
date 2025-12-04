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
  onRowClick?: (row: TData) => void;
  onPaginationChange: (newPageIndex: number, newPageSize: number) => void;
  onSortingChange: (sorting: { id: string; desc: boolean }[]) => void;
  onSearchChange: (value: string) => void;
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
  filterComponent,
  onRowClick,
  onPaginationChange,
  onSortingChange,
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const [search, setSearch] = React.useState("");
  const [showFilter, setShowFilter] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(columns.map((c) => String(c.accessorKey)));
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // 🔎 Debounced search
  React.useEffect(() => {
    const timeout = setTimeout(() => onSearchChange(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // 📤 Export ke Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, "data-export.xlsx");
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
    setSorting(newSorting);
    onSortingChange(newSorting);
  };

  // 🌈 UI helper
  const renderSortIcon = (accessorKey: string) => {
    const current = sorting[0];
    if (!current || current.id !== accessorKey) return null;
    return current.desc ? <ArrowDown className="inline ml-1 h-3 w-3" /> : <ArrowUp className="inline ml-1 h-3 w-3" />;
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
          <Button variant="outline" size="sm" onClick={exportToExcel} className="btn-gradient border-0">
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
                      <TableCell key={String(col.accessorKey)}>
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

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Page {pageIndex + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
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
      </div>
    </div>
  );
}
