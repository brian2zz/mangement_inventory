import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ==============================
// 🔹 GET — List suppliers (with pagination & search)
// ==============================
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const search = searchParams.get("search") || "";
        const sortField = searchParams.get("sortField") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        const skip = (page - 1) * limit;

        const allowedSortFields = [
            "id",
            "name",
            "phone",
            "email",
            "address",
            "contactPerson",
            "status",
            "createdAt",
            "updatedAt",
        ];

        const safeSortField = allowedSortFields.includes(sortField)
            ? sortField
            : "createdAt";

        const where =
            search.trim() !== ""
                ? {
                    OR: [
                        { name: { contains: search } },
                        { email: { contains: search } },
                        { phone: { contains: search } },
                        { address: { contains: search } },
                    ],
                }
                : {};

        const totalCount = await prisma.supplier.count({ where });

        const suppliers = await prisma.supplier.findMany({
            where,
            orderBy: { [safeSortField]: sortOrder === "desc" ? "desc" : "asc" },
            skip,
            take: limit,
        });

        return NextResponse.json({
            data: suppliers,
            totalCount,
            page,
            limit,
        });
    } catch (error: any) {
        console.error("GET /api/suppliers error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch suppliers" },
            { status: 500 }
        );
    }
}

// ==============================
// 🔹 POST — Create (single or bulk)
// ==============================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 🧩 Bulk import (array)
        if (Array.isArray(body)) {
            if (body.length === 0)
                return NextResponse.json({ error: "Empty supplier list" }, { status: 400 });

            const batchSize = 50;
            for (let i = 0; i < body.length; i += batchSize) {
                const batch = body.slice(i, i + batchSize);
                await prisma.supplier.createMany({
                    data: batch.map((s) => ({
                        name: s.name || s.supplierName,
                        phone: s.phone || s.phoneNumber,
                        address: s.address,
                        email: s.email || null,
                        contactPerson: s.contactPerson || null,
                        notes: s.notes || null,
                        status: s.status || "active",
                    })),
                    skipDuplicates: true,
                });
            }

            return NextResponse.json({ success: true, count: body.length });
        }

        // 🧩 Single insert
        const { name, phone, address, email, contactPerson, notes, status } = body;

        if (!name || !phone || !address)
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

        const supplier = await prisma.supplier.create({
            data: {
                name,
                phone,
                address,
                email: email || null,
                contactPerson: contactPerson || null,
                notes: notes || null,
                status: status || "active",
            },
        });

        return NextResponse.json({ success: true, supplier });
    } catch (error: any) {
        console.error("POST /api/suppliers error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create supplier" },
            { status: 500 }
        );
    }
}
