/**
 * API Route: Generate Installment Schedule PDF
 * GET /api/loans/[id]/installment-pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import { loanService } from '@src/features/loans/services/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Generate PDF using service
    const pdfBuffer = await loanService.generateInstallmentPDF(id);

    // Get loan number for filename
    const loan = await loanService.getById(id);

    // Return PDF as response
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Installment_Schedule_${loan.loanNumber || id}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating installment schedule PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
