import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// =============== GET PRODUCTS ===============
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const page = parseInt(searchParams.get("page") ?? "1", 10)
        const limit = parseInt(searchParams.get("limit") ?? "10", 10)
        const search = searchParams.get("search")?.trim() ?? ""
        const sortField = searchParams.get("sortField") ?? "createdAt"
        const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc"

        const skip = (page - 1) * limit

        // Validasi sortField agar cocok dengan Prisma schema
        const allowedSortFields = ["id", "name", "stock", "unitPrice", "createdAt", "updatedAt"]
        const safeSortField = allowedSortFields.includes(sortField) ? sortField : "createdAt"

        // 🔍 Search (WITHOUT mode: "insensitive" → MySQL tidak mendukung)
        const where =
            search !== ""
                ? {
                    OR: [
                        { name: { contains: search } },
                        { partNumber: { contains: search } },
                        { description: { contains: search } },
                        { cardNumber: { contains: search } },
                    ],
                }
                : {}

        const [totalCount, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [safeSortField]: sortOrder },
                include: {
                    category: { select: { name: true } },
                    supplier: { select: { name: true } },
                },
            }),
        ])

        const formattedData = products.map((p) => ({
            id: p.id,
            cardNumber: p.cardNumber || "-",
            productName: p.name,
            category: p.category?.name || "-",
            partNumber: p.partNumber || "-",
            stock: p.stock,
            unitPrice: Number(p.unitPrice),
            supplier: p.supplier?.name || "-",
            status: p.status,
            createdAt: p.createdAt,
        }))

        return NextResponse.json({
            success: true,
            data: formattedData,
            totalCount,
            page,
            limit,
        })
    } catch (error: any) {
        console.error("❌ GET /api/products error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to fetch products",
            },
            { status: 500 }
        )
    }
}

// =============== POST PRODUCTS (Add or Import) ===============
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        // 🧩 BULK IMPORT (Excel)
        if (Array.isArray(body)) {
            if (body.length === 0)
                return NextResponse.json({ success: false, error: "Empty product list" }, { status: 400 })

            const batchSize = 50

            for (let i = 0; i < body.length; i += batchSize) {
                const batch = body.slice(i, i + batchSize)

                await prisma.product.createMany({
                    data: batch.map((p) => ({
                        // 🧠 FIXED — convert all possible numeric fields to strings
                        cardNumber: p.cardNumber ? String(p.cardNumber) : null,
                        name: p.productName?.trim() || "Unnamed Product",
                        categoryId: p.categoryId ? Number(p.categoryId) : null,
                        partNumber: p.partNumber ? String(p.partNumber) : null,
                        description: p.description?.trim() || null,
                        stock: p.stock ? Number(p.stock) : 0,
                        unitPrice: p.unitPrice ? Number(p.unitPrice) : 0,
                        reorderLevel: p.reorderLevel ? Number(p.reorderLevel) : 0,
                        supplierId: p.supplierId ? Number(p.supplierId) : null,
                        status: p.status?.trim() || "active",
                    })),
                    skipDuplicates: true,
                })
            }

            return NextResponse.json({ success: true, count: body.length })
        }

        // 🧩 SINGLE PRODUCT CREATE
        else {
            const {
                cardNumber,
                productName,
                partNumber,
                categoryId,
                description,
                stock,
                unitPrice,
                reorderLevel,
                supplierId,
                status,
            } = body

            if (!productName || unitPrice === undefined || unitPrice === null) {
                return NextResponse.json(
                    { success: false, error: "Missing required fields (productName, unitPrice)" },
                    { status: 400 }
                )
            }

            const product = await prisma.product.create({
                data: {
                    cardNumber: cardNumber ? String(cardNumber) : null,
                    name: productName.trim(),
                    categoryId: categoryId ? Number(categoryId) : null,
                    partNumber: partNumber ? String(partNumber) : null,
                    description: description?.trim() || null,
                    stock: Number(stock) || 0,
                    unitPrice: Number(unitPrice),
                    reorderLevel: Number(reorderLevel) || 0,
                    supplierId: supplierId ? Number(supplierId) : null,
                    status: status?.trim() || "active",
                },
            })

            return NextResponse.json({ success: true, product })
        }
    } catch (error: any) {
        console.error("❌ POST /api/products error:", error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || "Failed to create product(s)",
            },
            { status: 500 }
        )
    }
}
