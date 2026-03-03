import { Font, pdf } from '@react-pdf/renderer';
import { TaxSubmissionPackagePdf } from '@src/features/documents/components/tax-submission-package-pdf';
import type { TaxFeeLoanItem } from '@src/features/documents/components/tax-submission-pdf/shared';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import React from 'react';

// Force Node.js runtime (ไม่ใช้ Edge — ต้องการ fs + Node.js crypto)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── Font registration (module-level, once per cold start) ────────────────────
let pdfFontFamily = 'Helvetica';
let fontsReady = false;

function ensureFonts(): string {
  if (fontsReady) return pdfFontFamily;
  try {
    const dir = path.join(process.cwd(), 'public', 'fonts');
    const regular = path.join(dir, 'THSarabunNew.ttf');
    const bold = path.join(dir, 'THSarabunNew Bold.ttf');
    if (fs.existsSync(regular) && fs.existsSync(bold)) {
      Font.register({
        family: 'SarabunPDF',
        fonts: [
          { src: regular, fontWeight: 'normal' },
          { src: bold, fontWeight: 'bold' },
        ],
      });
      pdfFontFamily = 'SarabunPDF';
    }
  } catch {
    // fallback to Helvetica
  }
  fontsReady = true;
  return pdfFontFamily;
}

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

    // อ่านโลโก้จาก public/images/ (server-side ใช้ fs ได้เลย)
    let logoSrc: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        logoSrc = `data:image/png;base64,${logoData.toString('base64')}`;
      }
    } catch {
      // ถ้าอ่านไม่ได้ ใบเสร็จจะไม่แสดงโลโก้
    }

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
        error:
          error instanceof Error ? error.message : 'PDF generation failed',
      },
      { status: 500 },
    );
  }
}
