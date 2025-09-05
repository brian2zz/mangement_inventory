import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const sortField = (searchParams.get("sort") || "name") as keyof typeof prisma.productCategory
    const sortOrder = (searchParams.get("order") || "asc") as "asc" | "desc"

    const skip = (page - 1) * limit
    console.log({ page, limit, search, sortField, sortOrder, skip })
    const where = search
        ? {
            name: { contains: search },
        }
        : {}

    const [total, categories] = await Promise.all([
        prisma.productCategory.count({ where }),
        prisma.productCategory.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortField]: sortOrder },
            include: { _count: { select: { products: true } } },
        }),
    ])

    return NextResponse.json({
        data: categories.map((c) => ({
            id: c.id,
            categoryName: c.name,
            productCount: c._count.products,
        })),
        total,
        page,
        limit,
    })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { categoryName, description } = body

        if (!categoryName || categoryName.trim() === "") {
            return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 })
        }

        const newCategory = await prisma.productCategory.create({
            data: {
                name: categoryName,
                description: description || "",
            },
        })

        return NextResponse.json({ success: true, category: newCategory })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, message: "Failed to create category" }, { status: 500 })
    }
}
