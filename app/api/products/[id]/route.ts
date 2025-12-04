import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 🟢 GET PRODUCT DETAIL
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: { select: { name: true } },
                supplier: { select: { name: true } },
            },
        })

        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

        return NextResponse.json({
            success: true,
            data: {
                id: product.id,
                cardNumber: product.cardNumber || "",
                productName: product.name,
                categoryId: product.categoryId,
                category: product.category?.name || "-",
                partNumber: product.partNumber || "",
                description: product.description || "",
                supplier: product.supplier?.name || "-",
                supplierId: product.supplierId,
                unitPrice: Number(product.unitPrice),
                reorderLevel: product.reorderLevel,
                currentStock: product.stock,
                status: product.status,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
            },
        })
    } catch (error: any) {
        console.error("❌ GET /api/products/[id] error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// 🟡 UPDATE PRODUCT
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        const body = await req.json()
        if (isNaN(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })

        const updated = await prisma.product.update({
            where: { id },
            data: {
                cardNumber: String(body.cardNumber || ""),
                name: body.productName,
                categoryId: body.categoryId ? Number(body.categoryId) : null,
                partNumber: body.partNumber || null,
                description: body.description || null,
                stock: Number(body.currentStock) || 0,
                unitPrice: Number(body.unitPrice) || 0,
                reorderLevel: Number(body.reorderLevel) || 0,
                supplierId: body.supplierId ? Number(body.supplierId) : null,
                status: body.status || "active",
            },
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        console.error("❌ PUT /api/products/[id] error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// 🔴 DELETE PRODUCT
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })

        await prisma.product.delete({ where: { id } })
        return NextResponse.json({ success: true, message: "Product deleted successfully" })
    } catch (error: any) {
        console.error("❌ DELETE /api/products/[id] error:", error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
