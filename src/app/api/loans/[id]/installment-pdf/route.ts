import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/prisma';
import {
  dayThai,
  formatThaiDate,
  monthThai,
  yearThai,
} from '@src/shared/lib/thai-date-utils';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch loan data with installments
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        application: true,
        installments: {
          orderBy: {
            installmentNumber: 'asc',
          },
        },
      },
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสินเชื่อ' },
        { status: 404 },
      );
    }

    // Get customer name
    const customerName = loan.customer?.profile
      ? `${loan.customer.profile.firstName || ''} ${loan.customer.profile.lastName || ''}`.trim()
      : 'ไม่ระบุ';

    // Generate installment rows HTML
    const installmentRows = loan.installments
      .map((inst) => {
        const balance =
          Number(loan.principalAmount) -
          Number(inst.principalAmount) * inst.installmentNumber;

        return `
      <tr>
        <td width="5%" style="text-align: center;">${inst.installmentNumber}</td>
        <td width="17%" style="text-align: center;">${inst.paidDate ? formatThaiDate(inst.paidDate) : '-'}</td>
        <td width="21%" style="text-align: center;">${inst.paidDate ? customerName : '-'}</td>
        <td width="21%" style="text-align: center;">${inst.paidDate ? '-' : '-'}</td>
        <td width="18%" style="text-align: right;">${Number(inst.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}&nbsp;&nbsp;</td>
        <td width="17%" style="text-align: right;">${balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}&nbsp;&nbsp;</td>
      </tr>
    `;
      })
      .join('');

    // Generate HTML for installment schedule
    const html = `
<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      padding: 40px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      font-weight: normal;
      padding: 4px 0;
    }
    .dotted {
      border-bottom: 1px dotted #000;
      text-align: center;
    }
    table[border] {
      border: 1px solid #000;
    }
    table[border] th,
    table[border] td {
      border: 1px solid #000;
      padding: 6px 4px;
    }
    .bold {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <table>
    <tr>
      <th style="font-size: 25px;"></th>
    </tr>
    <tr>
      <th width="100%" style="font-size: 28px;text-align:center;"><b>ตารางการผ่อนชำระ</b></th>
    </tr>
    <tr>
      <th style="font-size: 10px;"></th>
    </tr>
    <tr>
      <th width="4%">ชื่อผู้กู้</th>
      <th width="46%" class="dotted">${customerName}</th>
      <th width="3%"></th>
      <th width="7%">เจ้าหน้าที่</th>
      <th width="40%" class="dotted">-</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="3%">ที่อยู่</th>
      <th width="47%" class="dotted">${loan.customer?.profile?.address || ''}</th>
      <th width="3%"></th>
      <th width="4%">สาขา</th>
      <th width="43%" class="dotted">-</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="9%">เบอร์โทรศัพท์</th>
      <th width="41%" class="dotted">${loan.customer?.phoneNumber || ''}</th>
      <th width="3%"></th>
      <th width="11%">วันที่ออกสินเชื่อ</th>
      <th width="36%" class="dotted">${formatThaiDate(loan.contractDate)}</th>
    </tr>
    <tr>
      <th style="font-size: 13px;"></th>
    </tr>
    <tr>
      <th width="5%">วงเงินกู้</th>
      <th width="11%" class="dotted">${Number(loan.principalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</th>
      <th width="3%">บาท</th>
      <th width="1%"></th>
      <th width="9%">อัตราดอกเบี้ย</th>
      <th width="8%" class="dotted">${Number(loan.interestRate).toFixed(2)} %</th>
      <th width="3%">ต่อปี</th>
      <th width="1%"></th>
      <th width="10%">ระยะเวลาชำระ</th>
      <th width="5%" class="dotted">${loan.totalInstallments}</th>
      <th width="3%">งวด</th>
      <th width="1%"></th>
      <th width="5%">งวดละ</th>
      <th width="10%" class="dotted">${Number(loan.monthlyPayment).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</th>
      <th width="3%">บาท</th>
      <th width="1%"></th>
      <th width="9%">ชำระทุกวันที่</th>
      <th width="4%" class="dotted">${dayThai(loan.nextPaymentDate)}</th>
      <th width="9%">ของทุกเดือน</th>
    </tr>
    <tr>
      <th style="font-size: 13px;"></th>
    </tr>
  </table>
  <table border="1">
    <thead>
      <tr>
        <th width="5%" style="text-align: center;"><b>งวด</b></th>
        <th width="17%" style="text-align: center;"><b>วันที่ชำระ</b></th>
        <th width="21%" style="text-align: center;"><b>ผู้ชำระ</b></th>
        <th width="21%" style="text-align: center;"><b>ผู้รับชำระ</b></th>
        <th width="18%" style="text-align: center;"><b>ยอดชำระ (ต่อเดือน)</b></th>
        <th width="17%" style="text-align: center;"><b>ยอดค้างชำระคงเหลือ</b></th>
      </tr>
    </thead>
    <tbody>
      ${installmentRows}
    </tbody>
  </table>
</body>
</html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Return PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="installment-${loan.loanNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating installment PDF:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง PDF' },
      { status: 500 },
    );
  }
}
