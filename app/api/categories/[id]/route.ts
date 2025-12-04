import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


/**
 * ==============================
 * 🔍 GET /api/categories/:id
 * ==============================
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        if (!id || isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid category ID" },
                { status: 400 }
            );
        }

        const category = await prisma.productCategory.findUnique({
            where: { id },
            include: {
                _count: { select: { products: true } },
                products: {
                    select: { id: true, name: true, unitPrice: true, stock: true },
                },
            },
        });

        if (!category) {
            return NextResponse.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: category.id,
                name: category.name,
                description: category.description,
                totalProducts: category._count.products,
                products: category.products,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
        });
    } catch (error) {
        console.error("❌ GET /api/categories/:id error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch category detail" },
            { status: 500 }
        );
    }
}

/**
 * ==============================
 * 📝 PUT /api/categories/:id
 * ==============================
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        const body = await req.json();
        const { categoryName, description } = body;

        if (!id || isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid category ID" },
                { status: 400 }
            );
        }

        if (!categoryName || categoryName.trim() === "") {
            return NextResponse.json(
                { success: false, message: "Category name is required" },
                { status: 400 }
            );
        }

        const existing = await prisma.productCategory.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        const updated = await prisma.productCategory.update({
            where: { id },
            data: {
                name: categoryName,
                description: description || "",
            },
        });

        return NextResponse.json({ success: true, category: updated });
    } catch (error) {
        console.error("❌ PUT /api/categories/:id error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update category" },
            { status: 500 }
        );
    }
}

/**
 * ==============================
 * ❌ DELETE /api/categories/:id
 * ==============================
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);

        if (!id || isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid category ID" },
                { status: 400 }
            );
        }

        const existing = await prisma.productCategory.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Category not found" },
                { status: 404 }
            );
        }

        // Optional: cek jika kategori masih punya produk
        const productCount = await prisma.product.count({ where: { categoryId: id } });
        if (productCount > 0) {
            return NextResponse.json(
                { success: false, message: "Cannot delete category with existing products" },
                { status: 400 }
            );
        }

        await prisma.productCategory.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("❌ DELETE /api/categories/:id error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete category" },
            { status: 500 }
        );
    }
}
