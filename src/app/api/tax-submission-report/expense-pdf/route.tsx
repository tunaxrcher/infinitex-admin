import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import {
  ensureFonts,
  ExpenseReceiptPdf,
  loadLogoBase64,
  type ExpenseItem,
} from '@src/features/documents/pdf';

// Force Node.js runtime (ไม่ใช้ Edge — ต้องการ fs + Node.js crypto)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      expenses: ExpenseItem[];
      monthName: string;
      buddhistYear: number;
    };

    const { expenses, monthName, buddhistYear } = body;

    if (!expenses?.length) {
      return NextResponse.json(
        { error: 'No expenses provided' },
        { status: 400 },
      );
    }

    const fontFamily = ensureFonts();
    const logoSrc = loadLogoBase64();

    // Generate PDF on server
    const buffer = await pdf(
      <ExpenseReceiptPdf
        expenses={expenses}
        monthName={monthName || ''}
        buddhistYear={buddhistYear || new Date().getFullYear() + 543}
        fontFamily={fontFamily}
        logoSrc={logoSrc}
      />,
    ).toBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="expense-voucher.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Expense PDF Route] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'PDF generation failed',
      },
      { status: 500 },
    );
  }
}
