"use client";

import * as React from "react";
import { DataTableV2 } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface Supplier {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (supplier: Supplier) => void;
}

export default function SupplierSelectModal({ open, onClose, onSelect }: Props) {
    const [data, setData] = React.useState<Supplier[]>([]);
    const [totalCount, setTotalCount] = React.useState(0);
    const [pageIndex, setPageIndex] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [search, setSearch] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const fetchSuppliers = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/suppliers?page=${pageIndex + 1}&limit=${pageSize}&search=${encodeURIComponent(search)}`
            );
            if (!res.ok) throw new Error("Failed to fetch suppliers");
            const json = await res.json();
            // Expecting { success, data, totalCount, page, limit }
            setData(json.data || []);
            setTotalCount(json.totalCount || 0);
        } catch (err) {
            console.error("Failed to fetch suppliers:", err);
        } finally {
            setLoading(false);
        }
    }, [pageIndex, pageSize, search]);

    React.useEffect(() => {
        if (open) fetchSuppliers();
    }, [open, fetchSuppliers]);

    const columns: ColumnDef<Supplier>[] = [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "phone", header: "Phone" },
        { accessorKey: "email", header: "Email" },
    ];

    const handleRowClick = (row: Supplier) => {
        onSelect(row);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-[70%] max-h-[80vh] overflow-auto rounded-lg bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Select Supplier</h3>
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
                    searchPlaceholder="Search suppliers..."
                    haveFilter={false}
                    onSearchChange={(v) => {
                        setPageIndex(0);
                        setSearch(v);
                    }}
                    onPaginationChange={(newPage, newSize) => {
                        setPageIndex(newPage);
                        setPageSize(newSize);
                    }}
                    onSortingChange={() => {
                        /* server-side sorting can be added if needed */
                    }}
                    onRowClick={handleRowClick}
                />
            </div>
        </div>
    );
}
