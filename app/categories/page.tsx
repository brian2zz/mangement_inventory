"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, flexRender, getCoreRowModel } from "@tanstack/react-table";

interface Category {
  id: string;
  categoryName: string;
  productCount: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [data, setData] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("categoryName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        sortField,
        sortOrder,
      });
      const res = await fetch(`/api/categories?${params}`);
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, search, sortField, sortOrder]);

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        id: "id",
        header: "ID",
      },
      {
        id: "categoryName",
        header: "Category Name",
      },
      {
        id: "productCount",
        header: "Product Count",
      },
    ],
    []
  );

  const table = useMemo(() => {
    return {
      rows: data,
      getRowModel: () => data.map((d) => d), // simple mapping
    };
  }, [data]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        className="border p-2 mb-4"
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="border p-2 cursor-pointer"
                  onClick={() => {
                    if (sortField === col.id) {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField(col.id as string);
                      setSortOrder("asc");
                    }
                  }}
                >
                  {typeof col.header === "function" ? col.header({}) : col.header} {sortField === col.id ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => router.push(`/categories/${row.id}`)}
              >
                {columns.map((col) => (
                  <td key={col.id} className="border p-2">
                    {row[col.id as keyof Category]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="space-x-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded">
            Prev
          </button>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
