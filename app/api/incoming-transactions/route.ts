// app/api/incoming-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parse } from "date-fns";

const prisma = new PrismaClient();

// ===============================
// Helper: Format date dd-MM-YYYY
// ===============================
function formatDate(date: Date) {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

// ===============================
// Helper: Parse dd-MM-YYYY input
// ===============================
function parseDdMmYyyy(dateStr: string) {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;

    const [dd, mm, yyyy] = parts.map(Number);
    if (!dd || !mm || !yyyy) return null;

    return new Date(yyyy, mm - 1, dd);
}

function parseFlexibleDate(value: string) {
    // Case 1: yyyy-MM-dd (HTML input date)
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }

    // Case 2: dd-MM-yyyy (manual filter input)
    const parts = value.split("-");
    if (parts.length === 3) {
        const [dd, mm, yyyy] = parts.map(Number);
        const date = new Date(yyyy, mm - 1, dd);
        if (!isNaN(date.getTime())) return date;
    }

    return null;
}

function buildFilterWhere(filters: any[]) {
    if (!Array.isArray(filters)) return {};

    // Mapping operator UI → operator Prisma
    const prismaOperatorMap: any = {
        "=": "equals",
        ">": "gt",
        ">=": "gte",
        "<": "lt",
        "<=": "lte",
        "contains": "contains",
    };

    return {
        AND: filters
            .map((f) => {
                const { field, operator, value } = f;

                if (!field || value === undefined || value === "") return null;

                // Ambil operator Prisma
                const prismaOp = prismaOperatorMap[operator];
                if (!prismaOp) return null;

                // ===========================
                // DATE FIELD
                // ===========================
                if (field === "transactionDate") {
                    const parsedDate = parseFlexibleDate(value);
                    if (!parsedDate) return null;

                    return {
                        [field]: {
                            [prismaOp]: parsedDate,
                        },
                    };
                }

                // ===========================
                // STRING FIELDS
                // ===========================
                if (["notes", "status"].includes(field)) {
                    if (prismaOp === "contains") {
                        return { [field]: { contains: value } };
                    }
                    if (prismaOp === "equals") {
                        return { [field]: value };
                    }
                }

                // ===========================
                // RELATION FIELDS
                // (supplier.name, warehouse.name)
                // ===========================
                if (["supplier", "warehouse"].includes(field)) {
                    return {
                        [field]: {
                            name: { contains: value },
                        },
                    };
                }

                // ===========================
                // NUMBER FIELDS
                // ===========================
                if (["totalItems", "totalValue"].includes(field)) {
                    return {
                        [field]: {
                            [prismaOp]: Number(value),
                        },
                    };
                }

                return null;
            })
            .filter(Boolean),
    };
}

// =============== GET LIST ===============
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") ?? "1", 10);
        const limit = parseInt(searchParams.get("limit") ?? "10", 10);
        const search = (searchParams.get("search") ?? "").trim();
        const sortField = searchParams.get("sortField") ?? "createdAt";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        const skip = (page - 1) * limit;

        const allowedSortFields = [
            "id",
            "transactionDate",
            "totalItems",
            "totalValue",
            "createdAt",
            "updatedAt",
        ];
        const safeSortField = allowedSortFields.includes(sortField) ? sortField : "createdAt";


        // =====================================
        // 1) PARSE FILTER JSON
        // =====================================
        let filterWhere: any = {};
        const rawFilters = searchParams.get("filters");

        if (rawFilters) {
            try {
                const parsed = JSON.parse(rawFilters);
                filterWhere = buildFilterWhere(parsed) ?? {};
            } catch (e) {
                console.warn("Invalid filters:", e);
            }
        }


        // =====================================
        // 2) BUILD SEARCH WHERE
        // =====================================
        let searchWhere: any = {};

        if (search !== "") {
            searchWhere = {
                OR: [
                    { notes: { contains: search } },
                    { id: isNaN(Number(search)) ? undefined : Number(search) },
                    { status: { contains: search } },
                    {
                        supplier: {
                            name: { contains: search },
                        },
                    },
                    {
                        warehouse: {
                            name: { contains: search },
                        },
                    },
                ].filter(Boolean),
            };
        }


        // =====================================
        // 3) FINAL WHERE = FILTER + SEARCH
        // =====================================
        const finalWhere = {
            AND: [filterWhere, searchWhere].filter(Boolean),
        };


        const [totalCount, transactions] = await Promise.all([
            prisma.incomingTransaction.count({ where: finalWhere }),

            prisma.incomingTransaction.findMany({
                where: finalWhere,
                skip,
                take: limit,
                orderBy: { [safeSortField]: sortOrder },
                include: {
                    supplier: { select: { id: true, name: true } },
                    warehouse: { select: { id: true, name: true } },
                },
            }),
        ]);


        const formattedData = transactions.map((t) => ({
            id: t.id,
            transactionDate: formatDate(t.transactionDate),
            supplier: t.supplier?.name ?? "-",
            warehouse: t.warehouse?.name ?? "-",
            notes: t.notes ?? "-",
            submitStatus: t.status,
            totalItems: t.totalItems ?? 0,
            totalValue: Number(t.totalValue ?? 0),
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
        }));


        return NextResponse.json({
            success: true,
            data: formattedData,
            totalCount,
            page,
            limit,
        });
    } catch (error: any) {
        console.error("❌ GET /api/incoming-transactions error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch incoming transactions" },
            { status: 500 }
        );
    }
}


// =============== POST CREATE ===============
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        /**
         * Expected payload:
         * {
         *   supplierId: number,
         *   warehouseId?: number,
         *   transactionDate: string (ISO),
         *   notes?: string,
         *   status?: "Draft" | "Done", // default Draft
         *   items: [
         *     { productId: number, quantity: number, unitPrice: number }
         *   ]
         * }
         */

        const {
            supplierId,
            warehouseId,
            transactionDate,
            notes,
            status,
            items = [],
        } = body;

        if (!supplierId || !transactionDate) {
            return NextResponse.json(
                { success: false, error: "Missing required fields (supplierId, transactionDate)" },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            // You might allow creating header-only drafts; if you prefer require items remove this check.
            // For now allow empty items (totalItems 0)
        }

        // Compute totals
        const totalItems = items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);
        const totalValue = items.reduce(
            (s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
            0
        );

        // Create transaction and items in a transaction
        const created = await prisma.$transaction(async (tx) => {
            const trx = await tx.incomingTransaction.create({
                data: {
                    supplierId: Number(supplierId),
                    warehouseId: warehouseId ? Number(warehouseId) : null,  // FIX 1
                    transactionDate: new Date(transactionDate),
                    notes: notes?.trim() || null,
                    status: status === "Done" ? "Done" : "Draft",
                    totalItems,
                    totalValue,
                    createdById: body.createdById ? Number(body.createdById) : 1, // FIX 2
                },
            });

            // create items if any
            if (items && items.length > 0) {
                const itemCreates = items.map((it: any) => ({
                    incomingTransactionId: trx.id,
                    productId: Number(it.productId),
                    quantity: Number(it.quantity) || 0,
                    unitPrice: Number(it.unitPrice) || 0,
                    totalPrice: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
                    notes: it.notes?.trim() || null,
                }));

                await tx.incomingTransactionItem.createMany({
                    data: itemCreates,
                });
            }

            // If status is Done at creation, we must also update product stock and create StockMovement
            if (status === "Done" && items && items.length > 0) {
                for (const it of items) {
                    const productId = Number(it.productId);
                    const qty = Number(it.quantity) || 0;
                    if (qty <= 0) continue;

                    // get current stock
                    const prod = await tx.product.findUnique({ where: { id: productId } });
                    const prevStock = prod ? prod.stock : 0;
                    const newStock = prevStock + qty;

                    await tx.stockMovement.create({
                        data: {
                            productId,
                            movementType: "incoming",
                            quantity: qty,
                            previousStock: prevStock,
                            newStock,
                            referenceType: "IncomingTransaction",
                            referenceId: trx.id,
                            notes: `Incoming transaction ${trx.id} created as Done`,
                            createdById: body.createdById ? Number(body.createdById) : undefined,
                        },
                    });

                    await tx.product.update({
                        where: { id: productId },
                        data: { stock: newStock },
                    });
                }
            }

            return trx;
        });

        return NextResponse.json({ success: true, transaction: created });
    } catch (error: any) {
        console.error("❌ POST /api/incoming-transactions error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create incoming transaction" },
            { status: 500 }
        );
    }
}
