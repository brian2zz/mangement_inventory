import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatDate(date: Date) {
    return date.toISOString().split("T")[0]; // yyyy-MM-dd
}

function deriveStatus(requested: number, fulfilled: number): string {
    if (!fulfilled || fulfilled === 0) return "Pending";
    if (fulfilled < requested) return "Partial";
    return "Fulfilled";
}

// =================== GET LIST ===================
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const page = Number(url.searchParams.get("page") ?? 1);
        const limit = Number(url.searchParams.get("limit") ?? 10);
        const skip = (page - 1) * limit;

        const search = url.searchParams.get("search")?.trim() || "";
        const sortField = url.searchParams.get("sortField") || "requestDate";
        const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        const where =
            search !== ""
                ? {
                    OR: [
                        { requestedItem: { contains: search } },
                        { store: { contains: search } },
                        { supplier: { contains: search } },
                        { notes: { contains: search } },
                        { status: { contains: search } },
                    ],
                }
                : {};

        const [totalCount, rows] = await Promise.all([
            prisma.productRequest.count({ where }),
            prisma.productRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortField]: sortOrder },
            }),
        ]);

        const data = rows.map((r) => ({
            id: r.id.toString(),
            requestedItem: r.requestedItem,
            requestedQuantity: r.requestedQuantity,
            fulfilledQuantity: r.fulfilledQuantity,
            requestDate: formatDate(r.requestDate),
            fulfilledDate: r.fulfilledDate ? formatDate(r.fulfilledDate) : "",
            store: r.store,
            unitPrice: Number(r.unitPrice),
            totalPrice: Number(r.totalPrice),
            status: r.status as "Pending" | "Partial" | "Fulfilled",
        }));

        return NextResponse.json({
            success: true,
            data,
            totalCount,
            page,
            limit,
        });
    } catch (error: any) {
        console.error("❌ GET /api/product-requests error:", error);
        return NextResponse.json(
            { success: false, error: error.message ?? "Failed to fetch product requests" },
            { status: 500 }
        );
    }
}

// =================== CREATE (POST) ===================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            requestedItem,
            notes,
            requestedQuantity,
            fulfilledQuantity = 0,
            requestDate,
            fulfilledDate,
            store,
            supplier,
            unitPrice,
        } = body;

        if (!requestedItem || !store || !requestDate || requestedQuantity == null) {
            return NextResponse.json(
                { success: false, error: "requestedItem, store, requestDate, requestedQuantity wajib diisi" },
                { status: 400 }
            );
        }

        const reqQty = Number(requestedQuantity) || 0;
        const fulQty = Number(fulfilledQuantity) || 0;
        const price = Number(unitPrice) || 0;
        const total = reqQty * price;

        const status = deriveStatus(reqQty, fulQty);

        const created = await prisma.productRequest.create({
            data: {
                requestedItem: String(requestedItem),
                notes: notes ? String(notes) : null,
                requestedQuantity: reqQty,
                fulfilledQuantity: fulQty,
                requestDate: new Date(requestDate),
                fulfilledDate: fulfilledDate ? new Date(fulfilledDate) : null,
                store: String(store),
                supplier: supplier ? String(supplier) : null,
                unitPrice: price,
                totalPrice: total,
                status,
            },
        });

        return NextResponse.json({ success: true, id: created.id });
    } catch (error: any) {
        console.error("❌ POST /api/product-requests error:", error);
        return NextResponse.json(
            { success: false, error: error.message ?? "Failed to create product request" },
            { status: 500 }
        );
    }
}
