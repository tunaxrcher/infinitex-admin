import fs from 'fs';
import path from 'path';
import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { Font, pdf } from '@react-pdf/renderer';
import { IncomeExpensePdf } from '@src/features/documents/components/income-expense-pdf';
import type { IncomeExpenseItem } from '@src/features/documents/components/tax-submission-pdf/shared';

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

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      items: IncomeExpenseItem[];
      monthName: string;
      buddhistYear: number;
    };

    const { items, monthName, buddhistYear } = body;

    if (!items?.length) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 },
      );
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
      // ถ้าอ่านไม่ได้จะไม่แสดงโลโก้
    }

    // Generate PDF on server
    const buffer = await pdf(
      <IncomeExpensePdf
        items={items}
        monthName={monthName || ''}
        buddhistYear={buddhistYear || new Date().getFullYear() + 543}
        fontFamily={fontFamily}
        logoSrc={logoSrc}
      />,
    ).toBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="income-expense-statement.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Income-Expense PDF Route] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'PDF generation failed',
      },
      { status: 500 },
    );
  }
}
