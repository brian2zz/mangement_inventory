"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Customer {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export default function CustomerSelectModal({ open, onClose, onSelect }: Props) {
    const [data, setData] = useState<Customer[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search: search.trim(),
                sortField: "name",
                sortOrder: "asc",
            });

            const res = await fetch(`/api/customers?${params.toString()}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) fetchCustomers();
    }, [open, page, search]);


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Select Customer</DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="mb-4">
                    <Input
                        placeholder="Search customers..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                {/* Table */}
                <div className="border rounded-md max-h-96 overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2 text-left">Email</th>
                                <th className="p-2 text-left">Phone</th>
                                <th className="p-2 text-left">Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-4">No customers found</td>
                                </tr>
                            ) : (
                                data.map((c) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => {
                                            onSelect(c);
                                            onClose();
                                        }}
                                        className="cursor-pointer hover:bg-pink-50 transition"
                                    >
                                        <td className="p-2">{c.name}</td>
                                        <td className="p-2">{c.email || "-"}</td>
                                        <td className="p-2">{c.phone || "-"}</td>
                                        <td className="p-2">{c.address || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (simple) */}
                <div className="flex justify-between mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={data.length < limit}
                    >
                        Next
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
