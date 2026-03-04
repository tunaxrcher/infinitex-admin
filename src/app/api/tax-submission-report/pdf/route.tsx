import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import {
  ensureFonts,
  loadLogoBase64,
  TaxSubmissionPackagePdf,
  type TaxFeeLoanItem,
} from '@src/features/documents/pdf';

// Force Node.js runtime (ไม่ใช้ Edge — ต้องการ fs + Node.js crypto)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Image helper (server-side fetch — ไม่มี CORS) ────────────────────────────
async function imgToBase64(url?: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return `data:${ct};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

async function resolveImages(loan: TaxFeeLoanItem): Promise<TaxFeeLoanItem> {
  const [primaryBase64, ...supportBase64s] = await Promise.all([
    imgToBase64(loan.primaryImageUrl),
    ...(loan.supportingImages || []).map(imgToBase64),
  ]);
  const titleDeedsWithImg = await Promise.all(
    (loan.titleDeeds || []).map(async (d) => ({
      ...d,
      imageUrl: await imgToBase64(d.imageUrl),
    })),
  );
  return {
    ...loan,
    primaryImageUrl: primaryBase64,
    supportingImages: supportBase64s.filter((u): u is string => Boolean(u)),
    titleDeeds: titleDeedsWithImg,
  };
}

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      loans: TaxFeeLoanItem[];
      monthName: string;
      buddhistYear: number;
    };

    const { loans, monthName, buddhistYear } = body;

    if (!loans?.length) {
      return NextResponse.json({ error: 'No loans provided' }, { status: 400 });
    }

    const fontFamily = ensureFonts();
    const logoSrc = loadLogoBase64();

    // Fetch images server-side (ไม่มี CORS, ไม่ต้อง proxy)
    const loansWithImages = await Promise.all(loans.map(resolveImages));

    // Generate PDF on server
    const buffer = await pdf(
      <TaxSubmissionPackagePdf
        loans={loansWithImages}
        monthName={monthName || ''}
        buddhistYear={buddhistYear || new Date().getFullYear() + 543}
        fontFamily={fontFamily}
        logoSrc={logoSrc}
      />,
    ).toBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="tax-submission.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[PDF Route] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'PDF generation failed',
      },
      { status: 500 },
    );
  }
}
