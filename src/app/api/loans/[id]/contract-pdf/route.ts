import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@src/shared/lib/prisma';
import {
  dayThai,
  formatThaiDate,
  monthThai,
  numToThaiBath,
  yearThai,
} from '@src/shared/lib/thai-date-utils';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch loan data
    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        application: true,
      },
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลสินเชื่อ' },
        { status: 404 },
      );
    }

    // Calculate contract end date
    const contractDate = new Date(loan.contractDate);
    const endDate = new Date(contractDate);
    endDate.setMonth(endDate.getMonth() + loan.termMonths);

    // Get customer name
    const customerName = loan.customer?.profile
      ? `${loan.customer.profile.firstName || ''} ${loan.customer.profile.lastName || ''}`.trim()
      : 'ไม่ระบุ';

    // Generate HTML for contract
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
    th {
      font-weight: normal;
      padding: 2px 0;
    }
    .dotted {
      border-bottom: 1px dotted #000;
      text-align: center;
    }
    .center {
      text-align: center;
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
      <th width="100%" style="font-size: 28px;text-align:center;"><b>หนังสือสัญญากู้เงิน</b></th>
    </tr>
    <tr>
      <th style="font-size: 10px;"></th>
    </tr>
    <tr>
      <th width="55%"></th>
      <th width="10%">สัญญาทำขึ้นที่</th>
      <th width="35%" class="dotted">${loan.application?.propertyLocation ? loan.application.propertyLocation.substring(0, 30) : ''}</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="55%"></th>
      <th width="2%">วัน</th>
      <th width="8%" class="dotted">${dayThai(contractDate)}</th>
      <th width="4%">เดือน</th>
      <th width="19%" class="dotted">${monthThai(contractDate)}</th>
      <th width="3%">พ.ศ.</th>
      <th width="9%" class="dotted">${yearThai(contractDate)}</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="23%">สัญญากู้ยืมเงินฉบับนี้ ทำขึ้นระหว่าง</th>
      <th width="62%" class="dotted">${customerName}</th>
      <th width="3%">อายุ</th>
      <th width="10%" class="dotted">${loan.customer?.profile?.dateOfBirth ? Math.floor((Date.now() - new Date(loan.customer.profile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : ''}</th>
      <th width="2%">ปี</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="3%">ที่อยู่</th>
      <th width="97%" class="dotted">${loan.customer?.profile?.address || ''}</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้กู้"</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="3%">กับ</th>
      <th width="47%" class="dotted">บริษัท ฟินเอ็กซ์ จำกัด</th>
      <th width="50%">ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้ให้กู้"</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">โดยที่คู่สัญญาทั้งสองฝ่ายได้ตกลงกันดังต่อไปนี้</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="2%"></th>
      <th width="3%"><b>ข้อ</b></th>
      <th width="41%">1.ผู้ให้กู้ตกลงให้ยืม และผู้กู้ตกลงยืมเงินจากผู้ให้กู้เป็นจำนวนเงิน</th>
      <th width="17%" class="dotted">${Number(loan.principalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</th>
      <th width="4%">บาท</th>
      <th width="1%">(</th>
      <th width="30%" class="dotted">${numToThaiBath(Number(loan.principalAmount))}</th>
      <th width="1%">)</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">โดยผู้กู้ได้รับเงินกู้จำนวนดังกล่าวจากผู้ให้กู้ถูกต้องครบถ้วนในวันทำสัญญานี้แล้ว</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="2%"></th>
      <th width="3%"><b>ข้อ</b></th>
      <th width="33%">2.ผู้กู้ตกลงชำระดอกเบี้ยให้แก่ผู้ให้กู้ในอัตราร้อยละ</th>
      <th width="8%" class="dotted">${Number(loan.interestRate).toFixed(2)} %</th>
      <th width="55%">ต่อปี และต่อไปหากผู้ให้กู้ประสงค์จะเพิ่มอัตราดอกเบี้ยซึ่งไม่เกินไปกว่าอัตรากฎหมาย</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">กำหนดแล้วผู้กู้ยินยอมให้ผู้ให้กู้เพิ่มอัตราดอกเบี้ยดังกล่าวได้โดยจะไม่โต้แย้งประการใดทั้งสิ้น และจะมีผลบังคับทันทีเมื่อผู้ให้กู้แจ้งอัตราดอกเบี้ยที่กำหนดขึ้น</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="48%">ใหม่ให้ผู้กู้ทราบเป็นที่เรียบร้อย ซึ่งผู้กู้ตกลงชำระดอกเบี้ยเป็นรายเดือนทุกๆ</th>
      <th width="3%">วันที่</th>
      <th width="6%" class="dotted">${dayThai(loan.nextPaymentDate)}</th>
      <th width="22%">ของเดือน เริ่มงวดแรกภายในวันที่</th>
      <th width="21%" class="dotted">${formatThaiDate(loan.nextPaymentDate)}</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="2%"></th>
      <th width="3%"><b>ข้อ</b></th>
      <th width="65%">3.ผู้กู้ตกลงจะชำระเงินต้นและดอกเบี้ยดังกล่าวในข้อ 1 และ 2 คืนให้แก่ผู้ให้กู้จนครบถ้วนภายใน วันที่</th>
      <th width="29%" class="dotted">${formatThaiDate(endDate)}</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">ซึ่งต่อไปในสัญญานี้จะเรียกว่า "กำหนดชำระหนี้"</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="2%"></th>
      <th width="3%"><b>ข้อ</b></th>
      <th width="94%">4.หากผู้กู้ปฎิบัติผิดกำหนดชำระหนี้หรือผิดสัญญาในข้อหนึ่งข้อใดแห่งสัญญานี้ผู้กู้ยินยอมรับผิด และชำระหนี้เงินกู้และดอกเบี้ย พร้อมค่าเสียหายอื่นๆ</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">ที่ผู้ให้กู้จะพึงได้รับอันเนื่องมาจากการบังคับให้ผู้กู้ชำระหนี้ตามสัญญานี้</th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="7%">หมายเหตุ</th>
      <th width="93%" class="dotted"></th>
    </tr>
    <tr>
      <th width="100%" class="dotted"></th>
    </tr>
    <tr>
      <th width="100%" class="dotted"></th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="100%">ผู้กู้ได้เข้าใจข้อความในหนังสือสัญญานี้โดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้สำคัญต่อหน้าพยาน</th>
    </tr>
    <tr>
      <th style="font-size: 10px;"></th>
    </tr>
    <tr>
      <th width="12%"></th>
      <th width="4%">ลงชื่อ</th>
      <th width="25%" class="dotted"></th>
      <th width="4%">ผู้กู้</th>
      <th width="12%"></th>
      <th width="4%">ลงชื่อ</th>
      <th width="25%" class="dotted"></th>
      <th width="4%">ผู้ให้กู้</th>
      <th width="10%"></th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="15%"></th>
      <th width="1%">(</th>
      <th width="25%">..............................................................</th>
      <th width="1%">)</th>
      <th width="18%"></th>
      <th width="1%">(</th>
      <th width="25%">..............................................................</th>
      <th width="1%">)</th>
      <th width="13%"></th>
    </tr>
    <tr>
      <th style="font-size: 10px;"></th>
    </tr>
    <tr>
      <th width="12%"></th>
      <th width="4%">ลงชื่อ</th>
      <th width="25%" class="dotted"></th>
      <th width="4%">พยาน</th>
      <th width="12%"></th>
      <th width="4%">ลงชื่อ</th>
      <th width="25%" class="dotted"></th>
      <th width="4%">พยาน</th>
      <th width="10%"></th>
    </tr>
    <tr>
      <th style="font-size: 6px;"></th>
    </tr>
    <tr>
      <th width="15%"></th>
      <th width="1%">(</th>
      <th width="25%">..............................................................</th>
      <th width="1%">)</th>
      <th width="18%"></th>
      <th width="1%">(</th>
      <th width="25%">..............................................................</th>
      <th width="1%">)</th>
      <th width="13%"></th>
    </tr>
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
        'Content-Disposition': `inline; filename="contract-${loan.loanNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้าง PDF' },
      { status: 500 },
    );
  }
}
