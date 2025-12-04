import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getOrderBy } from "@/lib/sortFieldMapper";

const prisma = new PrismaClient();

const sortFieldMap: Record<string, string> = {
    id: "id",
    categoryName: "name",     // 🩷 inilah penyebab error kamu
    productCount: "_count",   // kalau mau nanti sorting by count bisa dihandle juga
    createdAt: "createdAt",
    updatedAt: "updatedAt",
};


/**
 * 🧩 Konversi filter builder ke Prisma "where" object (AMAN DARI UNDEFINED)
 */
function buildPrismaWhere(filters: any[] = []) {
    const where: any = {};

    if (!Array.isArray(filters) || filters.length === 0) return where;

    for (const f of filters) {
        if (!f) continue;
        const { field, operator, value } = f;

        if (!field || value === undefined || value === "") continue;

        switch (operator) {
            case "=":
                where[field] = value;
                break;
            case "!=":
                where[field] = { not: value };
                break;
            case ">":
                where[field] = { gt: Number(value) || value };
                break;
            case "<":
                where[field] = { lt: Number(value) || value };
                break;
            case ">=":
                where[field] = { gte: Number(value) || value };
                break;
            case "<=":
                where[field] = { lte: Number(value) || value };
                break;
            case "contains":
                where[field] = { contains: value }; // ✅ tanpa mode
                break;
            case "not contains":
                where[field] = { not: { contains: value } };
                break;
            case "startsWith":
                where[field] = { startsWith: value };
                break;
            case "endsWith":
                where[field] = { endsWith: value };
                break;
            default:
                break;
        }
    }

    return where;
}


/**
 * ==============================
 * 🧭 GET /api/categories
 * ==============================
 */
export async function GET(req: NextRequest) {
    console.log(req.url);

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const sortField = (searchParams.get("sortField") || "name") as string;
        const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
        const skip = (page - 1) * limit;

       const orderBy = getOrderBy("category", sortField, sortOrder);

        // ✅ Pastikan filters aman
        let filters: any[] = [];
        const filterParam = searchParams.get("filters");

        if (filterParam) {
            try {
                const parsed = JSON.parse(filterParam);
                if (Array.isArray(parsed)) filters = parsed;
            } catch (e) {
                console.warn("⚠️ Invalid filters JSON:", e);
            }
        }

        // 🔍 Build Prisma where
        let where = buildPrismaWhere(filters);

        // 🔎 Apply search
        if (search) {
            where = {
                ...where,
                name: { contains: search },
            };
        }

        const [total, categories] = await Promise.all([
            prisma.productCategory.count({ where }),
            prisma.productCategory.findMany({
                where,
                skip,
                take: limit,
                orderBy: orderBy,
                include: { _count: { select: { products: true } } },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: categories.map((c) => ({
                id: c.id,
                categoryName: c.name,
                productCount: c._count.products,
            })),
            total,
            page,
            limit,
        });
    } catch (error: any) {
        // 🧠 Deteksi tipe error
        let status = 500;
        let message = "Unexpected error occurred";
        let details: string | undefined;

        if (error instanceof SyntaxError) {
            message = "Invalid JSON format in filters or request";
            status = 400;
        } else if (error.code === "P2002") {
            message = "Database unique constraint violation";
            details = error.meta?.target?.join(", ");
            status = 409;
        } else if (error.code === "P2025") {
            message = "Database record not found";
            status = 404;
        } else if (error.code?.startsWith?.("P")) {
            message = `Database error (${error.code})`;
            details = error.message;
        } else if (error.name === "TypeError") {
            message = "Invalid data type or field in request parameters";
            details = error.message;
            status = 400;
        } else if (typeof error.message === "string") {
            message = error.message;
        }

        console.error("❌ GET /api/categories error:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
        });

        return NextResponse.json(
            {
                success: false,
                error: {
                    message,
                    details: details || null,
                    type: error.name || "UnknownError",
                },
            },
            { status }
        );
    }
}

/**
 * ==============================
 * ➕ POST /api/categories
 * ==============================
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { categoryName, description } = body;

        if (!categoryName || categoryName.trim() === "") {
            return NextResponse.json(
                { success: false, message: "Category name is required" },
                { status: 400 }
            );
        }

        const newCategory = await prisma.productCategory.create({
            data: {
                name: categoryName,
                description: description || "",
            },
        });

        return NextResponse.json({ success: true, category: newCategory });
    } catch (error) {
        console.error("❌ POST /api/categories error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create category" },
            { status: 500 }
        );
    }
}
