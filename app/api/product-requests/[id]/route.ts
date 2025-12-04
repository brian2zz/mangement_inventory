import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
}

function deriveStatus(requested: number, fulfilled: number): string {
    if (!fulfilled || fulfilled === 0) return "Pending";
    if (fulfilled < requested) return "Partial";
    return "Fulfilled";
}

// ============ GET DETAIL ============
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        const r = await prisma.productRequest.findUnique({
            where: { id },
        });

        if (!r) {
            return NextResponse.json({ success: false, error: "Product request not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                id: r.id,
                requestedItem: r.requestedItem,
                notes: r.notes,
                requestedQuantity: r.requestedQuantity,
                fulfilledQuantity: r.fulfilledQuantity,
                requestDate: formatDate(r.requestDate),
                fulfilledDate: r.fulfilledDate ? formatDate(r.fulfilledDate) : "",
                store: r.store,
                supplier: r.supplier,
                unitPrice: Number(r.unitPrice),
                totalPrice: Number(r.totalPrice),
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("❌ GET /api/product-requests/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message ?? "Failed to fetch product request" },
            { status: 500 }
        );
    }
}

// ============ UPDATE (PUT) ============
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        const body = await req.json();

        const {
            requestedItem,
            notes,
            requestedQuantity,
            fulfilledQuantity,
            requestDate,
            fulfilledDate,
            store,
            supplier,
            unitPrice,
        } = body;

        const existing = await prisma.productRequest.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ success: false, error: "Product request not found" }, { status: 404 });
        }

        const reqQty = requestedQuantity != null ? Number(requestedQuantity) : existing.requestedQuantity;
        const fulQty = fulfilledQuantity != null ? Number(fulfilledQuantity) : existing.fulfilledQuantity;
        const price = unitPrice != null ? Number(unitPrice) : Number(existing.unitPrice);
        const total = reqQty * price;
        const status = deriveStatus(reqQty, fulQty);

        const updated = await prisma.productRequest.update({
            where: { id },
            data: {
                requestedItem: requestedItem != null ? String(requestedItem) : existing.requestedItem,
                notes: notes !== undefined ? (notes ? String(notes) : null) : existing.notes,
                requestedQuantity: reqQty,
                fulfilledQuantity: fulQty,
                requestDate: requestDate ? new Date(requestDate) : existing.requestDate,
                fulfilledDate: fulfilledDate ? new Date(fulfilledDate) : existing.fulfilledDate,
                store: store != null ? String(store) : existing.store,
                supplier: supplier !== undefined ? (supplier ? String(supplier) : null) : existing.supplier,
                unitPrice: price,
                totalPrice: total,
                status,
            },
        });

        return NextResponse.json({ success: true, id: updated.id });
    } catch (error: any) {
        console.error("❌ PUT /api/product-requests/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message ?? "Failed to update product request" },
            { status: 500 }
        );
    }
}

// ============ DELETE ============
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        await prisma.productRequest.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ DELETE /api/product-requests/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message ?? "Failed to delete product request" },
            { status: 500 }
        );
    }
}
