// app/api/outgoing-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ================================
// Helper: format dd-MM-yyyy
// ================================
function formatDate(date: Date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

// ================================
// Parse dd-MM-yyyy / yyyy-MM-dd
// ================================
function parseFlexibleDate(value: string) {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    const dmy = /^\d{2}-\d{2}-\d{4}$/;

    if (iso.test(value)) return new Date(value);

    if (dmy.test(value)) {
        const [dd, mm, yyyy] = value.split("-").map(Number);
        return new Date(yyyy, mm - 1, dd);
    }

    return null;
}

// ================================
// FILTER BUILDER SUPPORT
// ================================
function buildFilterWhere(filters: any[]) {
    if (!Array.isArray(filters)) return {};

    const opMap: any = {
        "=": "equals",
        ">": "gt",
        ">=": "gte",
        "<": "lt",
        "<=": "lte",
        contains: "contains",
    };

    return {
        AND: filters
            .map((f) => {
                const { field, operator, value } = f;
                if (!field || value === "") return null;

                const prismaOp = opMap[operator];
                if (!prismaOp) return null;

                // DATE
                if (field === "transactionDate") {
                    const d = parseFlexibleDate(value);
                    if (!d || isNaN(d.getTime())) return null;
                    return { transactionDate: { [prismaOp]: d } };
                }

                // RELATIONS
                if (field === "warehouse") {
                    return { warehouse: { name: { contains: value } } };
                }
                if (field === "customer") {
                    return { customer: { name: { contains: value } } };
                }

                // STRING
                if (["notes", "status"].includes(field)) {
                    if (prismaOp === "contains") {
                        return { [field]: { contains: value } };
                    }
                    return { [field]: value };
                }

                // NUMBER
                if (["totalItems", "totalValue"].includes(field)) {
                    return { [field]: { [prismaOp]: Number(value) } };
                }

                return null;
            })
            .filter(Boolean),
    };
}

// ===============================
// GET LIST OUTGOING
// ===============================
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "10");
        const skip = (page - 1) * limit;

        const search = searchParams.get("search")?.trim() || "";
        const sortField = searchParams.get("sortField") ?? "transactionDate";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        // Allowed sortable fields
        const allowedSort = [
            "id",
            "transactionDate",
            "totalItems",
            "totalValue",
            "createdAt",
            "updatedAt",
        ];

        const safeSortField = allowedSort.includes(sortField)
            ? sortField
            : "transactionDate";

        // ======================
        // FILTER PROCESSING
        // ======================
        let filterWhere = {};
        const rawFilters = searchParams.get("filters");

        if (rawFilters) {
            try {
                filterWhere = buildFilterWhere(JSON.parse(rawFilters));
            } catch (e) {
                console.warn("Invalid filter JSON:", e);
            }
        }

        // ======================
        // SEARCH (global search)
        // ======================
        const searchWhere =
            search !== ""
                ? {
                    OR: [
                        { notes: { contains: search } },
                        { status: { contains: search } },
                        { id: isNaN(Number(search)) ? undefined : Number(search) },
                        { warehouse: { name: { contains: search } } },
                        { customer: { name: { contains: search } } },
                    ].filter(Boolean),
                }
                : {};

        // ======================
        // FINAL WHERE MERGED
        // ======================
        const finalWhere = {
            AND: [filterWhere, searchWhere].filter(Boolean),
        };

        const [totalCount, rows] = await Promise.all([
            prisma.outgoingTransaction.count({ where: finalWhere }),

            prisma.outgoingTransaction.findMany({
                where: finalWhere,
                skip,
                take: limit,
                orderBy: { [safeSortField]: sortOrder },
                include: {
                    warehouse: true,
                    customer: true,
                },
            }),
        ]);

        const formatted = rows.map((t) => ({
            id: t.id,
            transactionDate: formatDate(t.transactionDate),
            warehouse: t.warehouse?.name || "-",
            customer: t.customer?.name || "-",
            notes: t.notes || "-",
            status: t.status,
            totalItems: t.totalItems,
            totalValue: Number(t.totalValue),
        }));

        return NextResponse.json({
            success: true,
            data: formatted,
            totalCount,
            page,
            limit,
        });
    } catch (error: any) {
        console.error("❌ GET /api/outgoing error:", error);
        return NextResponse.json(
            { success: false, error: error.message ?? "Failed to fetch outgoing list" },
            { status: 500 }
        );
    }
}

// =============================
// POST - Create Outgoing Transaction
// =============================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            customerId,
            warehouseId,
            transactionDate,
            notes,
            status = "Draft",
            items = [],
            createdById,
        } = body;

        // ===========================
        // VALIDATION
        // ===========================
        if (!customerId) {
            return NextResponse.json(
                { success: false, error: "customerId is required" },
                { status: 400 }
            );
        }

        if (!warehouseId) {
            return NextResponse.json(
                { success: false, error: "warehouseId is required" },
                { status: 400 }
            );
        }

        if (!transactionDate) {
            return NextResponse.json(
                { success: false, error: "transactionDate is required" },
                { status: 400 }
            );
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { success: false, error: "Items cannot be empty" },
                { status: 400 }
            );
        }

        // Validate items
        for (const it of items) {
            if (!it.productId || it.productId <= 0) {
                return NextResponse.json(
                    { success: false, error: "Invalid productId in items" },
                    { status: 400 }
                );
            }
            if (!it.quantity || it.quantity <= 0) {
                return NextResponse.json(
                    { success: false, error: "Invalid quantity in items" },
                    { status: 400 }
                );
            }
        }

        // Compute totals
        const totalItems = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
        const totalValue = items.reduce(
            (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
            0
        );

        // =====================================================
        //  MAIN $TRANSACTION
        // =====================================================
        const created = await prisma.$transaction(async (tx) => {
            // 1. Create Outgoing Transaction Header
            const trx = await tx.outgoingTransaction.create({
                data: {
                    sourceLocation: "Main Warehouse", // FIXED
                    customerId: Number(customerId),
                    warehouseId: Number(warehouseId),
                    transactionDate: new Date(transactionDate),
                    notes: notes?.trim() || null,
                    status: status === "Done" ? "Done" : "Draft",
                    totalItems,
                    totalValue,
                    createdById: Number(createdById ?? 1)
                },
            })


            // 2. Create items
            const itemCreates = items.map((it: any) => ({
                outgoingTransactionId: trx.id,
                productId: Number(it.productId),
                quantity: Number(it.quantity) || 0,
                unitPrice: Number(it.unitPrice) || 0,
                totalPrice: (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
                notes: it.notes?.trim() || null,
            }));

            await tx.outgoingTransactionItem.createMany({
                data: itemCreates,
            });

            // 3. If STATUS = DONE → update stock & create stock movement
            if (status === "Done") {
                for (const it of items) {
                    const productId = Number(it.productId);
                    const qty = Number(it.quantity) || 0;
                    if (qty <= 0) continue;

                    // Get current stock
                    const prod = await tx.product.findUnique({
                        where: { id: productId },
                    });

                    if (!prod) {
                        throw new Error(`Product ${productId} not found`);
                    }

                    const prevStock = prod.stock;
                    const newStock = prevStock - qty;

                    if (newStock < 0) {
                        throw new Error(
                            `Insufficient stock for product ${prod.name}. Available: ${prevStock}, Required: ${qty}`
                        );
                    }

                    // Create stock movement
                    await tx.stockMovement.create({
                        data: {
                            productId,
                            movementType: "outgoing",
                            quantity: qty,
                            previousStock: prevStock,
                            newStock,
                            referenceType: "OutgoingTransaction",
                            referenceId: trx.id,
                            notes: `Outgoing transaction ${trx.id} created as Done`,
                            createdById: createdById ? Number(createdById) : undefined,
                        },
                    });

                    // Update product stock
                    await tx.product.update({
                        where: { id: productId },
                        data: { stock: newStock },
                    });
                }
            }

            return trx;
        });

        return NextResponse.json({
            success: true,
            transaction: created,
        });
    } catch (error: any) {
        console.error("❌ POST /api/outgoing-transactions error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to create outgoing transaction",
            },
            { status: 500 }
        );
    }
}
