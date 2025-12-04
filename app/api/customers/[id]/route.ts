import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* ======================================================
   GET /api/customers/[id]
   Ambil detail customer by ID
====================================================== */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!id) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

        const customer = await prisma.customer.findUnique({
            where: { id },
        });

        if (!customer)
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: customer });
    } catch (error: any) {
        console.error("❌ GET /api/customers/[id] error:", error);
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        );
    }
}

/* ======================================================
   PUT /api/customers/[id]
   Update customer by ID
====================================================== */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!id) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

        const body = await req.json();

        const updated = await prisma.customer.update({
            where: { id },
            data: {
                name: body.customerName,
                phone: body.phoneNumber,
                email: body.email,
                address: body.address,
                contactPerson: body.contactPerson,
                status: body.status ?? "active",
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        console.error("❌ PUT /api/customers/[id] error:", error);
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        );
    }
}

/* ======================================================
   DELETE /api/customers/[id]
   Hapus customer by ID
====================================================== */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = Number(params.id);
        if (!id) return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });

        await prisma.customer.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Customer deleted successfully" });
    } catch (error: any) {
        console.error("❌ DELETE /api/customers/[id] error:", error);
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        );
    }
}
