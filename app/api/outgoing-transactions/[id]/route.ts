// app/api/outgoing-transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// =============== FORMATTER ===============
function formatOutgoingPayload(t: any) {
    return {
        id: t.id,
        transactionDate: t.transactionDate,
        customerId: t.customerId,
        customer: t.customer ? { id: t.customer.id, name: t.customer.name } : null,
        warehouseId: t.warehouseId,
        warehouse: t.warehouse ? { id: t.warehouse.id, name: t.warehouse.name } : null,
        notes: t.notes,
        status: t.status,
        totalItems: t.totalItems,
        totalValue: Number(t.totalValue ?? 0),

        items: (t.items || []).map((it: any) => ({
            id: it.id,
            productId: it.productId,
            productName: it.product ? it.product.name : null,
            partNumber: it.product?.partNumber ?? null,
            quantity: it.quantity,
            unitPrice: Number(it.unitPrice),
            totalPrice: Number(it.totalPrice),
            notes: it.notes,
        })),

        createdBy: t.createdBy ? { id: t.createdBy.id, name: t.createdBy.name } : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
    };
}

//
// ================= GET DETAIL =================
//
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id))
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

        const trx = await prisma.outgoingTransaction.findUnique({
            where: { id },
            include: {
                customer: { select: { id: true, name: true } },
                warehouse: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, partNumber: true } },
                    },
                },
                createdBy: { select: { id: true, name: true } },
            },
        });

        if (!trx)
            return NextResponse.json({ success: false, error: "Outgoing transaction not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: formatOutgoingPayload(trx) });
    } catch (error: any) {
        console.error("❌ GET outgoing error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch outgoing transaction" },
            { status: 500 }
        );
    }
}

//
// ================= PUT UPDATE =================
//
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

        const body = await req.json();

        // Fetch existing
        const existing = await prisma.outgoingTransaction.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!existing)
            return NextResponse.json({ success: false, error: "Outgoing transaction not found" }, { status: 404 });

        const currentStatus = existing.status;

        // ---------------------------------------
        // If DONE → only allow updating date + notes
        // ---------------------------------------
        if (currentStatus === "Done") {
            const { transactionDate, notes } = body;

            const updated = await prisma.outgoingTransaction.update({
                where: { id },
                data: {
                    transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
                    notes: notes !== undefined ? notes : existing.notes,
                },
            });

            return NextResponse.json({
                success: true,
                data: formatOutgoingPayload({ ...existing, ...updated }),
            });
        }

        // ---------------------------------------
        // DRAFT → full editing allowed
        // ---------------------------------------
        const {
            customerId,
            warehouseId,
            transactionDate,
            notes,
            status: newStatus,
            items = [],
        } = body;

        if (!customerId || !warehouseId || !transactionDate)
            return NextResponse.json(
                { success: false, error: "Missing required fields (customerId, warehouseId, transactionDate)" },
                { status: 400 }
            );

        const result = await prisma.$transaction(async (tx) => {
            // 1) Update header first
            const updatedTrx = await tx.outgoingTransaction.update({
                where: { id },
                data: {
                    customerId: Number(customerId),
                    warehouseId: Number(warehouseId),
                    transactionDate: new Date(transactionDate),
                    notes: notes ?? null,
                    status: newStatus === "Done" ? "Done" : "Draft",
                },
            });

            // 2) Delete old items
            await tx.outgoingTransactionItem.deleteMany({
                where: { outgoingTransactionId: id },
            });

            // 3) Insert new items & compute totals
            let totalItems = 0;
            let totalValue = 0;

            for (const it of items) {
                const qty = Number(it.quantity) || 0;
                const up = Number(it.unitPrice) || 0;

                totalItems += qty;
                totalValue += qty * up;

                await tx.outgoingTransactionItem.create({
                    data: {
                        outgoingTransactionId: id,
                        productId: Number(it.productId),
                        quantity: qty,
                        unitPrice: up,
                        totalPrice: qty * up,
                        notes: it.notes ?? null,
                    },
                });
            }

            // 4) Update totals
            await tx.outgoingTransaction.update({
                where: { id },
                data: { totalItems, totalValue },
            });

            // ---------------------------------------
            // 5) STOCK MOVEMENT (Draft → Done)
            // ---------------------------------------
            if (existing.status !== "Done" && newStatus === "Done") {
                const insertedItems = await tx.outgoingTransactionItem.findMany({
                    where: { outgoingTransactionId: id },
                });

                for (const it of insertedItems) {
                    const product = await tx.product.findUnique({
                        where: { id: it.productId },
                    });

                    const prevStock = product?.stock ?? 0;
                    const newStock = prevStock - it.quantity;

                    await tx.stockMovement.create({
                        data: {
                            productId: it.productId,
                            movementType: "outgoing",
                            quantity: -it.quantity,
                            previousStock: prevStock,
                            newStock,
                            referenceType: "OutgoingTransaction",
                            referenceId: id,
                            notes: `Outgoing transaction ${id} marked as Done`,
                            createdById: body.createdById ? Number(body.createdById) : undefined,
                        },
                    });

                    await tx.product.update({
                        where: { id: it.productId },
                        data: { stock: newStock },
                    });
                }
            }

            return updatedTrx;
        });

        // return updated detail
        const fresh = await prisma.outgoingTransaction.findUnique({
            where: { id },
            include: {
                customer: true,
                warehouse: true,
                items: { include: { product: true } },
                createdBy: true,
            },
        });

        return NextResponse.json({ success: true, data: formatOutgoingPayload(fresh) });
    } catch (error: any) {
        console.error("❌ PUT outgoing error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update outgoing transaction" },
            { status: 500 }
        );
    }
}

//
// ================= DELETE =================
//
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id))
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

        const trx = await prisma.outgoingTransaction.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!trx)
            return NextResponse.json({ success: false, error: "Outgoing transaction not found" }, { status: 404 });

        await prisma.$transaction(async (tx) => {
            // If DONE → rollback stock
            if (trx.status === "Done") {
                for (const it of trx.items) {
                    const product = await tx.product.findUnique({
                        where: { id: it.productId },
                    });

                    const prevStock = product?.stock ?? 0;
                    const newStock = prevStock + it.quantity;

                    await tx.stockMovement.create({
                        data: {
                            productId: it.productId,
                            movementType: "rollback",
                            quantity: it.quantity,
                            previousStock: prevStock,
                            newStock,
                            referenceType: "OutgoingTransactionDeletion",
                            referenceId: id,
                            notes: `Rollback deleting outgoing transaction ${id}`,
                        },
                    });

                    await tx.product.update({
                        where: { id: it.productId },
                        data: { stock: newStock },
                    });
                }
            }

            await tx.outgoingTransactionItem.deleteMany({
                where: { outgoingTransactionId: id },
            });

            await tx.outgoingTransaction.delete({
                where: { id },
            });
        });

        return NextResponse.json({ success: true, message: "Outgoing transaction deleted" });
    } catch (error: any) {
        console.error("❌ DELETE outgoing error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete outgoing transaction" },
            { status: 500 }
        );
    }
}
