import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==============================
// 🔹 GET — Get supplier detail
// ==============================
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: Number(params.id) },
        });

        if (!supplier)
            return NextResponse.json(
                { success: false, error: "Supplier not found" },
                { status: 404 }
            );

        return NextResponse.json({ success: true, supplier });
    } catch (error: any) {
        console.error("GET /api/suppliers/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch supplier" },
            { status: 500 }
        );
    }
}

// ==============================
// 🔹 PUT — Update supplier
// ==============================
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, phone, address, email, contactPerson, notes, status } = body;

        const updatedSupplier = await prisma.supplier.update({
            where: { id: Number(params.id) },
            data: {
                name,
                phone,
                address,
                email,
                contactPerson,
                notes,
                status,
            },
        });

        return NextResponse.json({ success: true, supplier: updatedSupplier });
    } catch (error: any) {
        console.error("PUT /api/suppliers/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to update supplier" },
            { status: 500 }
        );
    }
}

// ==============================
// 🔹 DELETE — Remove supplier
// ==============================
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.supplier.delete({
            where: { id: Number(params.id) },
        });

        return NextResponse.json({ success: true, message: "Supplier deleted" });
    } catch (error: any) {
        console.error("DELETE /api/suppliers/[id] error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to delete supplier" },
            { status: 500 }
        );
    }
}
