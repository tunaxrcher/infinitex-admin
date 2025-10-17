import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function apiMiddleware(req: NextRequest) {
  // เช็คว่า user login หรือยัง
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // ถ้ายังไม่ login -> ส่ง 401 Unauthorized
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
        error: 'Unauthorized',
      },
      { status: 401 }
    )
  }

  // ถ้า login แล้ว -> ปล่อยผ่าน
  return NextResponse.next()
}

