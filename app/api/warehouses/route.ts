import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const page = Number(searchParams.get("page") ?? 1);
        const limit = Number(searchParams.get("limit") ?? 10);
        const search = searchParams.get("search")?.trim() ?? "";

        const skip = (page - 1) * limit;

        const where =
            search !== ""
                ? {
                    OR: [{ name: { contains: search } }, { address: { contains: search } }],
                }
                : {};

        const [totalCount, warehouses] = await Promise.all([
            prisma.warehouse.count({ where }),
            prisma.warehouse.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: "desc" },
            }),
        ]);

        const formatted = warehouses.map((w) => ({
            id: w.id,
            name: w.name,
            address: w.address,
            status: w.status,
        }));

        return NextResponse.json({
            success: true,
            data: formatted,
            totalCount,
            page,
            limit,
        });
    } catch (err: any) {
        console.error("❌ GET /api/warehouses error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
