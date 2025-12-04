import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getOrderBy } from "@/lib/sortFieldMapper";

const prisma = new PrismaClient();

/* ============================================================
   GET - List Customers (pagination + search + sorting)
   ============================================================ */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") ?? "1", 10)
        const limit = parseInt(searchParams.get("limit") ?? "10", 10)
        const search = searchParams.get("search") ?? ""
        const sortField = searchParams.get("sortField") ?? "createdAt"
        const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc"
        const skip = (page - 1) * limit

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
                : {}

        const orderBy = getOrderBy("customer", sortField, sortOrder)

        const [totalCount, customers] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
        ])

        return NextResponse.json({
            success: true,
            data: customers,
            totalCount,
            page,
            limit,
        })
    } catch (error: any) {
        console.error("❌ GET /api/customers error:", error)
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        )
    }
}

/* ============================================================
   POST - Create Customer(s)
   ============================================================ */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 🧩 BULK INSERT (Array)
        if (Array.isArray(body)) {
            if (body.length === 0)
                return NextResponse.json({ success: false, error: "No customers provided" }, { status: 400 });

            const batchSize = 50;
            let insertedCount = 0;

            for (let i = 0; i < body.length; i += batchSize) {
                const batch = body.slice(i, i + batchSize);
                const result = await prisma.customer.createMany({
                    data: batch.map((c) => ({
                        name: c.customerName,
                        phone: c.phoneNumber,
                        address: c.address,
                        email: c.email || null,
                        contactPerson: c.contactPerson || null,
                        status: c.status || "active",
                    })),
                    skipDuplicates: true,
                });
                insertedCount += result.count;
            }

            return NextResponse.json({ success: true, count: insertedCount });
        }

        // 🧩 SINGLE INSERT
        const { customerName, phoneNumber, address, email, contactPerson } = body;
        if (!customerName || !phoneNumber || !address)
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });

        const customer = await prisma.customer.create({
            data: {
                name: customerName,
                phone: phoneNumber,
                address,
                email: email || null,
                contactPerson: contactPerson || null,
                status: "active",
            },
        });

        return NextResponse.json({ success: true, customer });
    } catch (error: any) {
        console.error("❌ POST /api/customers error:", error);
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        );
    }
}

/* ============================================================
   PUT - Update Customer (single)
   ============================================================ */
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, phone, address, email, contactPerson, status } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Missing 'id' field for update" },
                { status: 400 }
            );
        }

        // Pastikan data exist
        const existing = await prisma.customer.findUnique({ where: { id: Number(id) } });
        if (!existing) {
            return NextResponse.json(
                { success: false, error: `Customer with ID ${id} not found` },
                { status: 404 }
            );
        }

        const updated = await prisma.customer.update({
            where: { id: Number(id) },
            data: {
                name,
                phone,
                address,
                email,
                contactPerson,
                status,
            },
        });

        return NextResponse.json({ success: true, customer: updated });
    } catch (error: any) {
        console.error("❌ PUT /api/customers error:", error);
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        );
    }
}

/* ============================================================
   DELETE - Delete Customer (single / multiple)
   ============================================================ */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const idsParam = searchParams.get("ids");

        // 🧩 Hapus satu customer via ?id=123
        if (id) {
            const deleted = await prisma.customer.delete({ where: { id: Number(id) } });
            return NextResponse.json({ success: true, deleted });
        }

        // 🧩 Hapus banyak customer via ?ids=1,2,3
        if (idsParam) {
            const ids = idsParam.split(",").map((v) => Number(v.trim())).filter(Boolean);
            if (ids.length === 0) {
                return NextResponse.json({ success: false, error: "No valid IDs provided" }, { status: 400 });
            }

            const result = await prisma.customer.deleteMany({ where: { id: { in: ids } } });
            return NextResponse.json({ success: true, deletedCount: result.count });
        }

        return NextResponse.json(
            { success: false, error: "Missing 'id' or 'ids' parameter" },
            { status: 400 }
        );
    } catch (error: any) {
        console.error("❌ DELETE /api/customers error:", error);
        return NextResponse.json(
            { success: false, error: { message: error.message, type: error.name } },
            { status: 500 }
        );
    }
}
