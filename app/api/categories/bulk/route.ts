// app/api/categories/bulk/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { categories } = await req.json()
    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 })
    }

    const created = await prisma.productCategory.createMany({
      data: categories.map((c: any) => ({
        name: c.categoryName,
        description: c.description || "",
      })),
    })

    return NextResponse.json({ success: true, createdCount: created.count })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, message: "Failed to create categories" }, { status: 500 })
  }
}
