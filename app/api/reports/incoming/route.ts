import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ---------------------------
   DATE FORMATTER: dd-MM-yyyy
---------------------------- */
function formatDate(date: Date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

/* ---------------------------
   PARSE dd-MM-yyyy OR yyyy-MM-dd
---------------------------- */
function parseDate(value: string) {
    if (!value) return null;

    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(value);
    }

    // dd-MM-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split("-").map(Number);
        return new Date(yyyy, mm - 1, dd);
    }

    return null;
}

/* ---------------------------
   BUILD FILTER
---------------------------- */
function buildFilterWhere(filters: any[]) {
    if (!Array.isArray(filters)) return {};

    const opMap: any = {
        "=": "equals",
        contains: "contains",
        ">": "gt",
        "<": "lt",
        ">=": "gte",
        "<=": "lte",
    };

    return {
        AND: filters
            .map((f) => {
                const { field, operator, value } = f;
                const op = opMap[operator];
                if (!op) return null;

                // DATE filter
                if (field === "transactionDate") {
                    const parsed = parseDate(value);
                    if (!parsed) return null;
                    return { incomingTransaction: { transactionDate: { [op]: parsed } } };
                }

                if (field === "supplier") {
                    return { incomingTransaction: { supplier: { name: { contains: value } } } };
                }

                if (field === "warehouse") {
                    return { incomingTransaction: { warehouse: { name: { contains: value } } } };
                }

                if (field === "category") {
                    return { product: { category: { name: { contains: value } } } };
                }

                return null;
            })
            .filter(Boolean),
    };
}

/* ---------------------------
   APPLY SORT ORDER (Perbaikan)
---------------------------- */
function applySortOrder(obj: any, sortOrder: "asc" | "desc"): any {
    const key = Object.keys(obj)[0];
    const val = obj[key];

    // Kalau level terakhir
    if (val === undefined) {
        return { [key]: sortOrder };
    }

    // Nested structure
    return {
        [key]: applySortOrder(val, sortOrder)
    };
}

/* ---------------------------
         API GET LIST
---------------------------- */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "10");
        const search = searchParams.get("search") ?? "";
        const sortField = searchParams.get("sortField") ?? "date";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        const skip = (page - 1) * limit;

        // Allowed sort fields
        const safeSortFields = {
            date: { incomingTransaction: { transactionDate: undefined } },
            productName: { product: { name: undefined } },
            category: { product: { category: { name: undefined } } },
            partNumber: { product: { partNumber: undefined } },
            supplier: { incomingTransaction: { supplier: { name: undefined } } },
            warehouse: { incomingTransaction: { warehouse: { name: undefined } } },
            quantityIn: { quantity: undefined },
            currentStock: { product: { stock: undefined } },
        } as const;

        const sortConfig =
            safeSortFields[sortField as keyof typeof safeSortFields] ??
            safeSortFields.date;

        const orderBy = applySortOrder(sortConfig, sortOrder);

        // Filters
        let filterWhere = {};
        const rawFilters = searchParams.get("filters");

        if (rawFilters) {
            try {
                filterWhere = buildFilterWhere(JSON.parse(rawFilters));
            } catch { }
        }

        // SEARCH
        const searchWhere =
            search.trim() === ""
                ? {}
                : {
                    OR: [
                        { product: { name: { contains: search } } },
                        { product: { partNumber: { contains: search } } },
                        { product: { category: { name: { contains: search } } } },
                        { incomingTransaction: { supplier: { name: { contains: search } } } },
                        { incomingTransaction: { warehouse: { name: { contains: search } } } },
                    ],
                };

        const where = { AND: [filterWhere, searchWhere] };

        /* ---------------------------
                 QUERY DB
        ---------------------------- */

        const [totalCount, rows] = await Promise.all([
            prisma.incomingTransactionItem.count({ where }),

            prisma.incomingTransactionItem.findMany({
                where,
                skip,
                take: limit,
                orderBy, // ← FIXED
                include: {
                    product: {
                        include: { category: true },
                    },
                    incomingTransaction: {
                        include: {
                            supplier: true,
                            warehouse: true,
                        },
                    },
                },
            }),
        ]);

        /* ---------------------------
               MAP TO REPORT FORMAT
        ---------------------------- */

        const data = rows.map((item) => ({
            id: item.id,
            date: formatDate(item.incomingTransaction.transactionDate),
            productName: item.product.name,
            category: item.product.category?.name ?? "-",
            partNumber: item.product.partNumber ?? "-",
            supplier: item.incomingTransaction.supplier?.name ?? "-",
            warehouse: item.incomingTransaction.warehouse?.name ?? "-",
            quantityIn: item.quantity,
            currentStock: item.product.stock,
            remarks: item.notes ?? "",
        }));

        return NextResponse.json({
            success: true,
            data,
            totalCount,
            page,
            limit,
        });
    } catch (error: any) {
        console.error("❌ REPORT INCOMING ERROR:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
