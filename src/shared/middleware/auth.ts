import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// หน้าที่ไม่ต้อง login
const publicPages = [
  '/signin',
  '/signup',
  '/reset-password',
  '/verify-email',
  '/change-password',
  '/loan/check', // หน้าตรวจสอบสินเชื่อสาธารณะ (ใช้ PIN แทน)
];

// หน้าเริ่มต้นหลัง login
const DEFAULT_REDIRECT = '/demo1';

export async function authMiddleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // เช็คว่า user login หรือยัง
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isPublicPage = publicPages.some((page) => pathname.startsWith(page));

  // ถ้า login แล้วแต่พยายามเข้าหน้า auth pages -> redirect ไปหน้าหลัก
  if (isAuthenticated && isPublicPage) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, req.url));
  }

  // ถ้ายังไม่ login และพยายามเข้าหน้าที่ต้อง login -> redirect ไปหน้า signin
  if (!isAuthenticated && !isPublicPage) {
    const from = pathname + search;
    const signInUrl = new URL('/signin', req.url);

    // เก็บ URL เดิมไว้ใน query parameter เพื่อ redirect กลับหลัง login
    if (from !== '/') {
      signInUrl.searchParams.set('from', from);
    }

    return NextResponse.redirect(signInUrl);
  }

  // ปล่อยผ่านได้
  return NextResponse.next();
}
