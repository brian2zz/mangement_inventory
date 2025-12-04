"use client";

import * as React from "react";
import { DataTableV2 } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface ProductRow {
    id: number;
    cardNumber?: string;
    productName: string;
    partNumber?: string;
    stock: number;
    unitPrice?: number;
    category?: string;
    supplier?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (product: ProductRow) => void;
}

export default function ProductSelectModal({ open, onClose, onSelect }: Props) {
    const [data, setData] = React.useState<ProductRow[]>([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const fetchProducts = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/products?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(search)}`
            );
            if (!res.ok) throw new Error("Failed to fetch products");
            const json = await res.json();
            // product API earlier returns fields: id, cardNumber, productName, partNumber, stock, unitPrice, category, supplier
            setData(
                (json.data || []).map((p: any) => ({
                    id: p.id,
                    cardNumber: p.cardNumber,
                    productName: p.productName,
                    partNumber: p.partNumber,
                    stock: p.stock ?? 0,
                    unitPrice: p.unitPrice ?? 0,
                    category: p.category ?? "-",
                    supplier: p.supplier ?? "-",
                }))
            );
            setTotalCount(json.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch products:", err);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, search]);

    React.useEffect(() => {
        if (open) fetchProducts();
    }, [open, fetchProducts]);

    const columns: ColumnDef<ProductRow>[] = [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "cardNumber", header: "Card" },
        { accessorKey: "productName", header: "Name" },
        { accessorKey: "partNumber", header: "Part #" },
        { accessorKey: "stock", header: "Stock" },
        { accessorKey: "unitPrice", header: "Unit Price" },
        { accessorKey: "category", header: "Category" },
    ];

    const handleRowClick = (row: ProductRow) => {
        onSelect(row);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-[70%] max-h-[80vh] overflow-auto rounded-lg bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Select Product</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Close
                    </Button>
                </div>

                <DataTableV2
                    columns={columns}
                    data={data}
                    totalCount={totalCount}
                    pageIndex={pageIndex}
                    pageSize={pageSize}
                    loading={loading}
                    searchPlaceholder="Search products..."
                    haveFilter={false}
                    onSearchChange={(v) => {
                        setPageIndex(0);
                        setSearch(v);
                    }}
                    onPaginationChange={(newPage, newSize) => {
                        setPageIndex(newPage);
                        setPageSize(newSize);
                    }}
                    onSortingChange={() => { }}
                    onRowClick={handleRowClick}
                />
            </div>
        </div>
    );
}
