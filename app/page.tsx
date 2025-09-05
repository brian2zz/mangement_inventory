"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Calendar } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, DollarSign, Clock } from "lucide-react"

interface DashboardData {
  date: string
  partNumber: string
  productName: string
  source: string
  stockIn: number
  stockOut: number
  destination: string
  stock: number
  remarks: string
}

const data: DashboardData[] = [
  {
    date: "2024-01-15",
    partNumber: "PN001",
    productName: "Widget A",
    source: "Supplier ABC",
    stockIn: 100,
    stockOut: 0,
    destination: "Warehouse 1",
    stock: 100,
    remarks: "Initial stock",
  },
  {
    date: "2024-01-16",
    partNumber: "PN002",
    productName: "Widget B",
    source: "Supplier XYZ",
    stockIn: 50,
    stockOut: 0,
    destination: "Warehouse 2",
    stock: 50,
    remarks: "New arrival",
  },
  {
    date: "2024-01-17",
    partNumber: "PN001",
    productName: "Widget A",
    source: "Warehouse 1",
    stockIn: 0,
    stockOut: 25,
    destination: "Customer 123",
    stock: 75,
    remarks: "Customer order",
  },
  {
    date: "2024-01-18",
    partNumber: "PN003",
    productName: "Widget C",
    source: "Supplier DEF",
    stockIn: 200,
    stockOut: 0,
    destination: "Warehouse 1",
    stock: 200,
    remarks: "Bulk order",
  },
  {
    date: "2024-01-19",
    partNumber: "PN002",
    productName: "Widget B",
    source: "Warehouse 2",
    stockIn: 0,
    stockOut: 10,
    destination: "Customer 456",
    stock: 40,
    remarks: "Small order",
  },
]

const columns: ColumnDef<DashboardData>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("date")}</div>,
  },
  {
    accessorKey: "partNumber",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Part Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "productName",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "stockIn",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock In
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const stockIn = row.getValue("stockIn") as number
      return <Badge variant={stockIn > 0 ? "default" : "secondary"}>{stockIn}</Badge>
    },
  },
  {
    accessorKey: "stockOut",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock Out
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const stockOut = row.getValue("stockOut") as number
      return <Badge variant={stockOut > 0 ? "destructive" : "secondary"}>{stockOut}</Badge>
    },
  },
  {
    accessorKey: "destination",
    header: "Destination",
  },
  {
    accessorKey: "stock",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Current Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      return (
        <div className="font-medium">
          <Badge variant={stock > 50 ? "default" : stock > 20 ? "secondary" : "destructive"}>{stock}</Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
  },
]

export default function Dashboard() {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  })

  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
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
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
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
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                className="text-gray-700"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Products</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              1,234
            </div>
            <p className="text-xs text-gray-500">+20.1% from last month</p>
          </div>
        </div>
        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Low Stock Items</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              23
            </div>
            <p className="text-xs text-gray-500">-4 from yesterday</p>
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
              $45,231
            </div>
            <p className="text-xs text-gray-500">+7% from last month</p>
          </div>
        </div>
        <div className="enhanced-card p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              12
            </div>
            <p className="text-xs text-gray-500">+2 new today</p>
          </div>
        </div>
      </div>

      <div className="enhanced-card p-6">
        <DataTable columns={columns} data={data} searchPlaceholder="Search transactions..." />
      </div>
    </div>
  )
}
