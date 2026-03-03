import { NextRequest, NextResponse } from 'next/server';

/** Server-side image proxy — ใช้ fetch S3/DO Spaces จาก server เพื่อหลีก CORS */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // อนุญาตเฉพาะ https:// เพื่อความปลอดภัย
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return new NextResponse('Invalid url', { status: 400 });
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, {
        status: res.status,
      });
    }

    const contentType =
      res.headers.get('content-type') || 'application/octet-stream';
    const data = await res.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[proxy-image] fetch error:', error);
    return new NextResponse('Error fetching upstream image', { status: 502 });
  }
}
