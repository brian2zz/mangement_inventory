// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })

    const { password: _, ...userWithoutPassword } = user
    return NextResponse.json({ success: true, user: userWithoutPassword })
}
