"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowLeft, ArrowUpDown, Save, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableV2 as DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import SupplierSelectModal from "@/components/selectors/SupplierSelectModal"
import { apiFetch } from "@/lib/api"
import { DateRange } from "react-day-picker"
import { Switch } from "@/components/ui/switch"

/* ================== TYPES ================== */
interface Category {
  id: number
  categoryName: string
}

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  cardNumber?: string
  productName: string
  categoryId: number | null
  partNumber?: string
  description?: string
  supplierId?: number | null
  supplierName?: string
  unitPrice: number
  reorderLevel: number
  currentStock: number
  status: "active" | "passive"   // ⬅️ tambahkan ini
}

interface detailRow {
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

const productColumns: ColumnDef<detailRow>[] = [
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

/* ================== MAIN PAGE ================== */
export default function ProductDetailPage({ id }: { id: string }) {
  const router = useRouter()

  const [isLoading, setIsLoading] = React.useState(false)
  const [product, setProduct] = React.useState<Product | null>(null)
  const [categories, setCategories] = React.useState<Category[]>([])
  const [openSupplierModal, setOpenSupplierModal] = React.useState(false)

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1), // awal tahun
    to: new Date(), // hari ini
  });
  const [data, setData] = React.useState<detailRow[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pageIndex, setPageIndex] = React.useState(0); // 0-based untuk UI
  const [pageSize, setPageSize] = React.useState(10);

  const [sorting, setSorting] = React.useState<
    { id: string; desc: boolean }[]
  >([
    { id: "date", desc: true } // ⬅️ DEFAULT DESC
  ]);

  const [search, setSearch] = React.useState("");

  /* ================== FETCH PRODUCT ================== */
  const fetchData = React.useCallback(async () => {
    if (!dateRange?.from || !dateRange.to) return;

    setIsLoading(true);

    const sort = sorting[0];
    const sortField = sort?.id ?? "date";
    const sortOrder = sort?.desc ? "desc" : "asc";
    const token = localStorage.getItem("token");

    const params = new URLSearchParams();
    params.set("page", String(pageIndex + 1)); // backend pakai 1-based
    params.set("limit", String(pageSize));
    params.set("search", search);
    params.set("sortField", sortField);
    params.set("sortOrder", sortOrder);
    params.set("from", dateRange.from.toISOString());
    params.set("to", dateRange.to.toISOString());
    params.set("productId", id);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/rekap?${params.toString()}`,
      {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );
    const json = await res.json();

    if (json.success) {
      setData(json.data);
      setTotalCount(json.totalCount);
    } else {
      console.error(json.error);
    }

    setIsLoading(false);
  }, [pageIndex, pageSize, sorting, dateRange, search]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  React.useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiFetch(`/products/${id}`)
        const json = await res.json()
        if (json.success) setProduct(json.data)
      } catch (err) {
        console.error("Failed to fetch product", err)
      }
    }
    fetchProduct()
  }, [id])

  /* ================== FETCH CATEGORIES ================== */
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch("/categories?limit=100")
        const json = await res.json()
        if (json.success) setCategories(json.data)
      } catch (err) {
        console.error("Failed to fetch categories", err)
      }
    }
    fetchCategories()
  }, [])

  /* ================== SAVE ================== */
  const handleSave = async () => {
    if (!product) return

    setIsLoading(true)
    try {
      const res = await apiFetch(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          cardNumber: product.cardNumber,
          productName: product.productName,
          categoryId: product.categoryId,
          partNumber: product.partNumber,
          description: product.description,
          supplierId: product.supplierId,
          unitPrice: product.unitPrice,
          reorderLevel: product.reorderLevel,
          currentStock: product.currentStock,
          status: product.status,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Update failed")
      }

      alert("Product updated successfully")
    } catch (err) {
      console.error(err)
      alert("Failed to update product")
    } finally {
      setIsLoading(false)
    }
  }

  /* ================== DELETE ================== */
  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const res = await apiFetch(`/products/${id}`, { method: "DELETE" })
      const json = await res.json()

      if (!json.success) throw new Error(json.error)
      alert("Product deleted")
      router.push("/products")
    } catch (err) {
      console.error(err)
      alert("Failed to delete product")
    } finally {
      setIsLoading(false)
    }
  }

  if (!product)
    return <div className="p-6 text-center text-gray-500">Loading...</div>

  /* ================== RENDER ================== */
  return (
    <div className="space-y-6 gradient-bg min-h-screen p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 text-pink-600" />
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            Product Detail
          </h1>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isLoading} className="btn-gradient">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* PRODUCT INFO */}
      <div className="enhanced-card p-6 grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label>Card Number</Label>
          <Input value={product.cardNumber || ""} onChange={(e) => setProduct({ ...product, cardNumber: e.target.value })} />

          <Label>Product Name</Label>
          <Input value={product.productName} onChange={(e) => setProduct({ ...product, productName: e.target.value })} />

          <Label>Category</Label>
          <Select
            value={product.categoryId ? String(product.categoryId) : ""}
            onValueChange={(v) => setProduct({ ...product, categoryId: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Part Number</Label>
          <Input value={product.partNumber || ""} onChange={(e) => setProduct({ ...product, partNumber: e.target.value })} />
        </div>

        <div className="space-y-4">
          <Label>Supplier</Label>
          <div className="flex gap-2">
            <Input value={product.supplierName || ""} readOnly />
            <Button onClick={() => setOpenSupplierModal(true)}>Select</Button>
          </div>

          <Label>Unit Price</Label>
          <Input type="number" value={product.unitPrice} onChange={(e) => setProduct({ ...product, unitPrice: Number(e.target.value) })} />

          <Label>Reorder Level</Label>
          <Input type="number" value={product.reorderLevel} onChange={(e) => setProduct({ ...product, reorderLevel: Number(e.target.value) })} />

          <Label>Current Stock</Label>
          <Input value={product.currentStock} readOnly />

          <Label>Status</Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={product.status === "active"}
              onCheckedChange={(checked) =>
                setProduct({
                  ...product,
                  status: checked ? "active" : "passive",
                })
              }
            />
            <span className={`font-medium ${product.status === "active"
              ? "text-green-600"
              : "text-gray-500"
              }`}>
              {product.status === "active" ? "Active" : "Passive"}
            </span>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="enhanced-card p-6">
        <Label>Description</Label>
        <Textarea
          rows={3}
          value={product.description || ""}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
        />
      </div>

      {/* Products Table */}
      <div className="enhanced-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Summary Product</h2>
        <DataTable
          columns={productColumns}
          data={data}
          totalCount={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          loading={isLoading}
          searchPlaceholder="Search transactions..."
          haveFilter={true}
          haveFilterExport={false}
          linkExport="/dashboard/rekap/export"
          filterExport={{ productId: id }}
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
          }} />
      </div>

      {/* SUPPLIER MODAL */}
      <SupplierSelectModal
        open={openSupplierModal}
        onClose={() => setOpenSupplierModal(false)}
        onSelect={(s: Supplier) =>
          setProduct((p) =>
            p ? { ...p, supplierId: s.id, supplierName: s.name } : p
          )
        }
      />
    </div>
  )
}
