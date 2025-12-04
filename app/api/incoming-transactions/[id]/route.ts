// app/api/incoming-transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatTransactionPayload(t: any) {
    return {
        id: t.id,
        transactionDate: t.transactionDate,
        supplierId: t.supplierId,
        supplier: t.supplier ? { id: t.supplier.id, name: t.supplier.name } : null,
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

// =============== GET DETAIL ===============
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        const trx = await prisma.incomingTransaction.findUnique({
            where: { id },
            include: {
                supplier: { select: { id: true, name: true } },
                warehouse: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true, stock: true } },
                    },
                },
                createdBy: { select: { id: true, name: true } },
            },
        });

        if (!trx) {
            return NextResponse.json({ success: false, error: "Incoming transaction not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: formatTransactionPayload(trx) });
    } catch (error: any) {
        console.error("❌ GET /api/incoming-transactions/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch incoming transaction" },
            { status: 500 }
        );
    }
}

// =============== PUT UPDATE ===============
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        const body = await req.json();

        /**
         * Acceptable updates:
         * - If current status === "Draft": allow update header (supplierId, warehouseId, transactionDate, notes), items array, and status (can set to "Done")
         * - If current status === "Done": only allow updating transactionDate and notes
         *
         * Items payload (for Draft):
         * items: [{ productId, quantity, unitPrice, notes }]
         *
         * If status transitions Draft -> Done, apply stock updates and create StockMovement for each item.
         */

        const existing = await prisma.incomingTransaction.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Incoming transaction not found" }, { status: 404 });
        }

        const currentStatus = existing.status || "Draft";

        // If existing is Done, only allow editing transactionDate and notes
        if (currentStatus === "Done") {
            const { transactionDate, notes } = body;
            // Only update allowed fields
            const updated = await prisma.incomingTransaction.update({
                where: { id },
                data: {
                    transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
                    notes: notes !== undefined ? String(notes) : existing.notes,
                },
            });

            return NextResponse.json({ success: true, transaction: formatTransactionPayload({ ...existing, ...updated }) });
        }

        // Otherwise currentStatus is Draft -> full update allowed
        const {
            supplierId,
            warehouseId,
            transactionDate,
            notes,
            status: newStatus,
            items = [],
        } = body;

        // Validate basic
        if (!supplierId || !transactionDate) {
            return NextResponse.json(
                { success: false, error: "Missing required fields (supplierId, transactionDate)" },
                { status: 400 }
            );
        }

        // We'll perform all operations in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1) update header
            const updatedTrx = await tx.incomingTransaction.update({
                where: { id },
                data: {
                    supplierId: Number(supplierId),
                    warehouseId: warehouseId ? Number(warehouseId) : undefined,
                    transactionDate: new Date(transactionDate),
                    notes: notes?.trim() || null,
                    status: newStatus === "Done" ? "Done" : "Draft",
                    // We'll recalc totals below
                },
            });

            // 2) delete old items and recreate (simpler approach)
            await tx.incomingTransactionItem.deleteMany({ where: { incomingTransactionId: id } });

            // create new items
            let totalItems = 0;
            let totalValue = 0;

            if (Array.isArray(items) && items.length > 0) {
                const createManyData = items.map((it: any) => {
                    const qty = Number(it.quantity) || 0;
                    const up = Number(it.unitPrice) || 0;
                    totalItems += qty;
                    totalValue += qty * up;
                    return {
                        incomingTransactionId: id,
                        productId: Number(it.productId),
                        quantity: qty,
                        unitPrice: up,
                        totalPrice: qty * up,
                        notes: it.notes?.trim() || null,
                    };
                });

                await tx.incomingTransactionItem.createMany({ data: createManyData });
            }

            // 3) update totals on trx
            await tx.incomingTransaction.update({
                where: { id },
                data: { totalItems, totalValue },
            });

            // 4) If status transitioned Draft -> Done, apply stock updates & create StockMovement per item
            if (existing.status !== "Done" && newStatus === "Done") {
                // fetch items to get productIds & qty
                const itemsInserted = await tx.incomingTransactionItem.findMany({ where: { incomingTransactionId: id } });

                for (const it of itemsInserted) {
                    const productId = it.productId;
                    const qty = it.quantity;

                    if (qty <= 0) continue;

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
                            referenceId: id,
                            notes: `Incoming transaction ${id} marked as Done`,
                            createdById: body.createdById ? Number(body.createdById) : undefined,
                        },
                    });

                    await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
                }
            }

            return { id, updatedTrxId: updatedTrx.id };
        });

        // return fresh detail
        const fresh = await prisma.incomingTransaction.findUnique({
            where: { id },
            include: {
                supplier: { select: { id: true, name: true } },
                warehouse: { select: { id: true, name: true } },
                items: { include: { product: { select: { id: true, name: true } } } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ success: true, transaction: formatTransactionPayload(fresh) });
    } catch (error: any) {
        console.error("❌ PUT /api/incoming-transactions/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update incoming transaction" },
            { status: 500 }
        );
    }
}

// =============== DELETE ===============
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
        }

        const existing = await prisma.incomingTransaction.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!existing) {
            return NextResponse.json({ success: false, error: "Incoming transaction not found" }, { status: 404 });
        }

        // Deletion behavior:
        // - If Draft: just delete transaction + items
        // - If Done: rollback stock (subtract quantities), create StockMovement for rollback, then delete items & trx

        await prisma.$transaction(async (tx) => {
            if (existing.status === "Done") {
                // rollback stock for each item
                for (const it of existing.items) {
                    const productId = it.productId;
                    const qty = it.quantity;

                    if (qty <= 0) continue;

                    const prod = await tx.product.findUnique({ where: { id: productId } });
                    const prevStock = prod ? prod.stock : 0;
                    const newStock = prevStock - qty;

                    // create stock movement representing rollback
                    await tx.stockMovement.create({
                        data: {
                            productId,
                            movementType: "rollback", // descriptive
                            quantity: -qty,
                            previousStock: prevStock,
                            newStock,
                            referenceType: "IncomingTransactionDeletion",
                            referenceId: id,
                            notes: `Rollback due to deletion of incoming transaction ${id}`,
                            // createdById: (if available)
                        },
                    });

                    await tx.product.update({ where: { id: productId }, data: { stock: newStock } });
                }
            }

            // Delete items & transaction
            await tx.incomingTransactionItem.deleteMany({ where: { incomingTransactionId: id } });
            await tx.incomingTransaction.delete({ where: { id } });
        });

        return NextResponse.json({ success: true, message: "Incoming transaction deleted" });
    } catch (error: any) {
        console.error("❌ DELETE /api/incoming-transactions/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete incoming transaction" },
            { status: 500 }
        );
    }
}
