/*
import { Document as PdfDocument } from '@react-pdf/renderer';
import { AppraisalPage } from './tax-submission-pdf/appraisal-page';
import { CloseCasePage } from './tax-submission-pdf/close-case-page';
import { ReceiptPage } from './tax-submission-pdf/receipt-page';
import { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export type { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => [
        <ReceiptPage key={`r-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <CloseCasePage key={`c-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <AppraisalPage key={`a-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
      ])}
    </PdfDocument>
  );
}
*/
import { Document as PdfDocument } from '@react-pdf/renderer';
import { AppraisalPage } from './tax-submission-pdf/appraisal-page';
import { CloseCasePage } from './tax-submission-pdf/close-case-page';
import { ReceiptPage } from './tax-submission-pdf/receipt-page';
import { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export type { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => [
        <ReceiptPage key={`r-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <CloseCasePage key={`c-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <AppraisalPage key={`a-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
      ])}
    </PdfDocument>
  );
}
/*
import { Document as PdfDocument } from '@react-pdf/renderer';
import { AppraisalPage } from './tax-submission-pdf/appraisal-page';
import { CloseCasePage } from './tax-submission-pdf/close-case-page';
import { ReceiptPage } from './tax-submission-pdf/receipt-page';
import { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export type { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => [
        <ReceiptPage key={`r-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <CloseCasePage key={`c-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <AppraisalPage key={`a-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
      ])}
    </PdfDocument>
  );
}
import {
  Document as PdfDocument,
  Image as PdfImage,
  Page as PdfPage,
  StyleSheet as PdfStyleSheet,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

export interface TaxFeeLoanItem {
  id: string;
  loanId?: string;
  loanNumber: string;
  customerName: string;
  placeName?: string;
  placeDisplay?: string;
  allPlaceNames?: string[];
  titleDeedCount?: number;
  propertyType?: string;
  customerAddress?: string;
  customerTaxId?: string;
  paymentRef?: string;
  transactionId?: string;
  loanPrincipal: number;
  interestRate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  remainingBalance?: number;
  contractDate?: string | null;
  expiryDate?: string | null;
  titleDeedNumber?: string | null;
  ownerName?: string;
  propertyValue?: number;
  estimatedValue?: number;
  valuationDate?: string | null;
  titleDeeds?: Array<{
    isPrimary?: boolean | null;
    deedNumber?: string | null;
    provinceName?: string | null;
    amphurName?: string | null;
    landAreaText?: string | null;
    ownerName?: string | null;
    landType?: string | null;
  }>;
  date?: string | null;
  installmentNumber?: number | null;
  taxRate: number;
  feeAmount: number;
}

const formatCurrency = (value: number | undefined | null) => {
  const num = value ?? 0;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateOrDash = (value?: string | Date | null) => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

const wrapDocCode = (value?: string | null, chunkSize = 12) => {
  const raw = String(value || '-');
  if (raw === '-') return raw;
  const softBreak = '\u200b';
  let result = '';
  let tokenCount = 0;

  for (const ch of raw) {
    result += ch;
    if (/[A-Za-z0-9]/.test(ch)) {
      tokenCount += 1;
      if (tokenCount >= chunkSize) {
        result += softBreak;
        tokenCount = 0;
      }
    } else {
      tokenCount = 0;
    }
  }

  return result;
};

const toThaiBahtText = (amount: number): string => {
  const numberText = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const digitText = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  if (!Number.isFinite(amount)) return '(ศูนย์บาทถ้วน)';
  const rounded = Math.round(amount);
  if (rounded === 0) return '(ศูนย์บาทถ้วน)';

  let text = '';
  const chars = String(rounded).split('').reverse();
  for (let i = chars.length - 1; i >= 0; i--) {
    const n = Number(chars[i]);
    const p = i;
    if (n === 0) continue;

    if (p % 6 === 0 && p > 0) {
      text += 'ล้าน';
    }

    if (p % 6 === 1 && n === 1) {
      text += 'สิบ';
      continue;
    }

    if (p % 6 === 1 && n === 2) {
      text += 'ยี่สิบ';
      continue;
    }

    if (p % 6 === 0 && n === 1 && p > 0) {
      text += 'เอ็ด';
      continue;
    }

    text += numberText[n] + digitText[p % 6];
  }

  return `(${text}บาทถ้วน)`;
};

const pdfStyles = PdfStyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'Helvetica',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  muted: { color: '#6b7280', fontSize: 10 },
  textRight: { textAlign: 'right' },
  receiptTitleTh: { fontSize: 34, fontWeight: 700, lineHeight: 1.1 },
  receiptTitleEn: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  tableBlueTitle: { color: '#1d4ed8', fontSize: 18, fontWeight: 700, marginTop: 22 },
  box: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    padding: 8,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  noBottom: { borderBottomWidth: 0 },
});

export function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => {
        const subtotal = Number(loan.feeAmount || 0);
        const vat = subtotal * 0.07;
        const grand = subtotal + vat;
        const primaryDeed =
          loan.titleDeeds?.find((deed) => deed.isPrimary) || loan.titleDeeds?.[0];
        const titleDeed = primaryDeed;
        const propertyType = (loan.propertyType || primaryDeed?.landType || '').trim();
        const normalizedAllPlaceNames = (loan.allPlaceNames || [])
          .map((name) => String(name || '').trim().replace(/\s+/g, ' '))
          .filter((name) => name && name !== '-');
        const placeNameFromLoan = String(loan.placeName || '')
          .trim()
          .replace(/\s+/g, ' ');
        const fallbackPlaceName =
          placeNameFromLoan ||
          normalizedAllPlaceNames[0] ||
          [primaryDeed?.amphurName, primaryDeed?.provinceName]
            .filter(Boolean)
            .join(' ')
            .trim()
            .replace(/\s+/g, ' ');
        const isMultipleDeed = Number(loan.titleDeedCount || 0) > 1;
        const productListPlaceDisplay = isMultipleDeed
          ? `โฉนดชุด (${normalizedAllPlaceNames.join(', ') || fallbackPlaceName || '-'})`
          : fallbackPlaceName || '-';
        const propertyLocation =
          productListPlaceDisplay && productListPlaceDisplay !== '-'
            ? productListPlaceDisplay
            : '';
        const displayType = (propertyType || titleDeed?.landType || 'ที่ดิน').trim();
        const receiptItemName = [displayType, propertyLocation]
          .filter(Boolean)
          .join(' ')
          .trim();
        const netValue = Number(loan.estimatedValue || loan.propertyValue || 0);
        const compareRows = [
          ['1', 'บ้านทาวน์เฮ้าส์ใกล้เคียง', netValue * 0.98],
          ['2', 'ตลบใกล้เคียงทาง', netValue * 1.01],
          ['3', 'ท้องแปลงใกล้เคียง', netValue * 0.95],
        ];

        const receiptPage = (
          <PdfPage key={`r-${loan.id}`} size="A4" style={[pdfStyles.page, { fontFamily }]}>
            <PdfView style={pdfStyles.rowBetween}>
              <PdfView style={{ width: '35%' }}>
                <PdfImage
                  src="/images/logo.png"
                  style={{ width: 140, height: 48, objectFit: 'contain' }}
                />
              </PdfView>
              <PdfView style={{ width: '63%' }}>
                <PdfText style={{ fontSize: 26, fontWeight: 700, textAlign: 'right' }}>
                  บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight, marginTop: 3 }}>
                  ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
                </PdfText>
              </PdfView>
            </PdfView>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 20 }}>
              <PdfView>
                <PdfText style={pdfStyles.receiptTitleTh}>ใบเสร็จรับเงิน</PdfText>
                <PdfText style={pdfStyles.receiptTitleEn}>Receipt</PdfText>
              </PdfView>
              <PdfView style={{ width: '44%' }}>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  ทะเบียนเลขที่ / Registration No. 0345568003383
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  เลขประจำตัวผู้เสียภาษี / Tax ID. 0345568003383
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  เลขที่สาขา 00000
                </PdfText>
              </PdfView>
            </PdfView>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 18, alignItems: 'stretch' }}>
              <PdfView style={{ ...pdfStyles.box, width: '39%', minHeight: 110 }}>
                <PdfText style={{ fontSize: 16, fontWeight: 700 }}>{loan.customerName || '-'}</PdfText>
                <PdfText style={{ marginTop: 10, fontSize: 12 }}>{loan.customerAddress || '-'}</PdfText>
                <PdfText style={{ marginTop: 12, fontSize: 10 }}>
                  เลขประจำตัวผู้เสียภาษี / TAX ID. {loan.customerTaxId || '-'}
                </PdfText>
              </PdfView>

              <PdfView style={{ width: '59%', minHeight: 110 }}>
                <PdfView style={pdfStyles.rowBetween}>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>เลขที่</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>No.</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>
                          {loan.loanNumber || '-'}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>เลขที่ใบเสร็จ</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>Receipt No.</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText
                          style={{
                            fontSize: 8.7,
                            fontWeight: 700,
                            textAlign: 'left',
                            lineHeight: 1.1,
                          }}
                        >
                          {wrapDocCode(loan.paymentRef)}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                </PdfView>
                <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 6 }}>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>เลขที่ทำรายการ</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>Transaction No.</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText
                          style={{
                            fontSize: 8.7,
                            textAlign: 'left',
                            lineHeight: 1.1,
                          }}
                        >
                          {wrapDocCode(loan.transactionId || loan.id || '-')}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>วันออกใบเสร็จ</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>Receipt Date</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText style={{ fontSize: 11, textAlign: 'right' }}>
                          {formatDateOrDash(loan.date)}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                </PdfView>
              </PdfView>
            </PdfView>

            <PdfText style={pdfStyles.tableBlueTitle}>รายการ / List</PdfText>
            <PdfView
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderTopColor: '#111827',
                borderBottomColor: '#111827',
                borderTopStyle: 'solid',
                borderBottomStyle: 'solid',
                paddingVertical: 8,
              }}
            >
              <PdfText style={{ width: '40%', fontSize: 11, textAlign: 'center', lineHeight: 1.25 }}>
                ชื่อรายการ{'\n'}
                <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Item name</PdfText>
              </PdfText>
              <PdfText style={{ width: '40%', fontSize: 11, textAlign: 'center', lineHeight: 1.25 }}>
                รายละเอียด{'\n'}
                <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Details</PdfText>
              </PdfText>
              <PdfText style={{ width: '20%', fontSize: 11, textAlign: 'right', lineHeight: 1.25 }}>
                ค่าธรรมเนียม{'\n'}
                <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Fee</PdfText>
              </PdfText>
            </PdfView>
            <PdfView style={{ flexDirection: 'row', paddingVertical: 8 }}>
              <PdfText style={{ width: '40%', fontSize: 12 }}>
                {receiptItemName}
              </PdfText>
              <PdfText style={{ width: '40%', fontSize: 12 }}>
                - ค่าธรรมเนียมบริการ{'\n'}- ค่าดำเนินการ โอน-ไถ่ถอน
              </PdfText>
              <PdfText style={{ width: '20%', fontSize: 12, textAlign: 'right' }}>
                {formatCurrency(subtotal)}
              </PdfText>
            </PdfView>
            <PdfView style={{ borderBottomWidth: 1, borderBottomColor: '#111827', borderBottomStyle: 'solid', paddingBottom: 6 }}>
              <PdfText style={{ textAlign: 'right', fontSize: 12 }}>
                ค่าธรรมเนียมรวมทั้งสิ้น {formatCurrency(subtotal)} บาท
              </PdfText>
            </PdfView>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 14, alignItems: 'flex-end' }}>
              <PdfText style={{ width: '55%', fontSize: 12 }}>{toThaiBahtText(grand)}</PdfText>
              <PdfView style={{ width: '43%' }}>
                <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                  <PdfText>ยอดรวมก่อนภาษี (Subtotal)</PdfText>
                  <PdfText>{formatCurrency(subtotal)}</PdfText>
                </PdfView>
                <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                  <PdfText>ภาษีมูลค่าเพิ่ม 7% (VAT 7%)</PdfText>
                  <PdfText>{formatCurrency(vat)}</PdfText>
                </PdfView>
                <PdfView
                  style={{
                    ...pdfStyles.rowBetween,
                    borderTopWidth: 1,
                    borderTopColor: '#111827',
                    borderTopStyle: 'solid',
                    paddingTop: 4,
                  }}
                >
                  <PdfText style={{ fontWeight: 700 }}>ยอดรวมทั้งสิ้น (Grand Total)</PdfText>
                  <PdfText style={{ fontWeight: 700 }}>{formatCurrency(grand)}</PdfText>
                </PdfView>
              </PdfView>
            </PdfView>

            <PdfText style={{ marginTop: 20, color: '#1d4ed8', fontSize: 14, fontWeight: 700 }}>
              หมายเหตุ
            </PdfText>
            <PdfText style={{ marginTop: 6, color: '#6b7280' }}>-</PdfText>
          </PdfPage>
        );

        const closeCasePage = (
          <PdfPage key={`c-${loan.id}`} size="A4" style={[pdfStyles.page, { fontFamily }]}>
            <PdfText style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
              ใบปิดเคสสินเชื่อ
            </PdfText>
            <PdfText style={{ ...pdfStyles.muted, textAlign: 'center', marginTop: 2 }}>
              โครงรายละเอียดสินเชื่อและวิเคราะห์สินเชื่อ
            </PdfText>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
              <PdfText style={{ fontWeight: 700 }}>เลขที่สินเชื่อ: {loan.loanNumber || '-'}</PdfText>
              <PdfText style={{ fontWeight: 700 }}>วันที่ปิดเคส: {formatDateOrDash(loan.date)}</PdfText>
            </PdfView>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
              <PdfView style={{ width: '63%' }}>
                <PdfView style={pdfStyles.box}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    รายละเอียดสินเชื่อ
                  </PdfText>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ผู้กู้</PdfText>
                    <PdfText>{loan.customerName || '-'}</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ยอดสินเชื่อ</PdfText>
                    <PdfText>{formatCurrency(loan.loanPrincipal || 0)} บาท</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>อัตราดอกเบี้ย</PdfText>
                    <PdfText>{formatCurrency(loan.interestRate || 0)}%</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ระยะเวลา</PdfText>
                    <PdfText>{loan.termMonths || 0} เดือน</PdfText>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                    <PdfText>วันทำสัญญา / วันครบกำหนด</PdfText>
                    <PdfText>
                      {formatDateOrDash(loan.contractDate)} / {formatDateOrDash(loan.expiryDate)}
                    </PdfText>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 10 }}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    วิเคราะห์สินเชื่อ
                  </PdfText>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>คงเหลือก่อนปิด</PdfText>
                    <PdfText>{formatCurrency(loan.remainingBalance || 0)} บาท</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ค่างวด</PdfText>
                    <PdfText>{formatCurrency(loan.monthlyPayment || 0)} บาท</PdfText>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                    <PdfText>ค่าธรรมเนียมรอบนี้</PdfText>
                    <PdfText>{formatCurrency(loan.feeAmount || 0)} บาท</PdfText>
                  </PdfView>
                </PdfView>
              </PdfView>

              <PdfView style={{ width: '35%' }}>
                <PdfView style={pdfStyles.box}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>หลักประกัน</PdfText>
                  <PdfText>เลขที่โฉนด: {loan.titleDeedNumber || titleDeed?.deedNumber || '-'}</PdfText>
                  <PdfText style={{ marginTop: 4 }}>เนื้อที่: {titleDeed?.landAreaText || '-'}</PdfText>
                  <PdfText style={{ marginTop: 4 }}>
                    ที่ตั้ง: {titleDeed?.amphurName || '-'} {titleDeed?.provinceName || '-'}
                  </PdfText>
                  <PdfText style={{ marginTop: 4 }}>ผู้ถือกรรมสิทธิ์: {titleDeed?.ownerName || loan.ownerName || '-'}</PdfText>
                </PdfView>
                <PdfView style={{ ...pdfStyles.box, marginTop: 10 }}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>สถานะปิดเคส</PdfText>
                  <PdfText>เลขที่อ้างอิง: {loan.paymentRef || '-'}</PdfText>
                  <PdfText style={{ marginTop: 4 }}>Transaction: {loan.transactionId || '-'}</PdfText>
                  <PdfText style={{ marginTop: 8, color: '#059669', fontWeight: 700 }}>ปิดเคสเรียบร้อย</PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
          </PdfPage>
        );

        const appraisalPage = (
          <PdfPage key={`a-${loan.id}`} size="A4" style={[pdfStyles.page, { fontFamily }]}>
            <PdfText style={{ fontSize: 40, fontWeight: 700, textAlign: 'center' }}>
              ใบประเมินมูลค่าทรัพย์สิน
            </PdfText>
            <PdfView style={{ ...pdfStyles.rowBetween, alignItems: 'center', marginTop: 4 }}>
              <PdfView style={{ width: '28%', borderTopWidth: 1, borderTopColor: '#9ca3af', borderTopStyle: 'solid' }} />
              <PdfText style={{ width: '44%', textAlign: 'center', fontSize: 14 }}>
                รายงานการประเมินราคาอสังหาริมทรัพย์
              </PdfText>
              <PdfView style={{ width: '28%', borderTopWidth: 1, borderTopColor: '#9ca3af', borderTopStyle: 'solid' }} />
            </PdfView>
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 10 }}>
              <PdfView>
                <PdfText style={{ fontWeight: 700 }}>หลักทรัพย์ : {loan.loanNumber || '-'}</PdfText>
                <PdfText style={{ marginTop: 2 }}>คำรับ : วางหลักทรัพย์จำนอง</PdfText>
              </PdfView>
              <PdfView style={pdfStyles.textRight}>
                <PdfText style={{ fontWeight: 700 }}>
                  วันที่ประเมิน : {formatDateOrDash(loan.valuationDate || loan.date)}
                </PdfText>
                <PdfText style={{ marginTop: 2 }}>
                  เลขที่รายงาน : AV-REP-{loan.loanNumber || '-'}
                </PdfText>
              </PdfView>
            </PdfView>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
              <PdfView style={{ width: '59%' }}>
                <PdfView style={pdfStyles.box}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 120, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    ข้อมูลทรัพย์สิน
                  </PdfText>
                  <PdfView style={{ marginTop: 4 }}>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ประเภททรัพย์</PdfText>
                      <PdfText>{titleDeed?.landType || 'ที่ดินพร้อมสิ่งปลูกสร้าง'}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>เนื้อที่ดิน</PdfText>
                      <PdfText>{titleDeed?.landAreaText || '-'}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ที่ตั้ง</PdfText>
                      <PdfText>{titleDeed?.amphurName || '-'} / {titleDeed?.provinceName || '-'}</PdfText>
                    </PdfView>
                    <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                      <PdfText>ผู้ถือกรรมสิทธิ์</PdfText>
                      <PdfText>{titleDeed?.ownerName || loan.ownerName || '-'}</PdfText>
                    </PdfView>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 130, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    ผลการประเมินมูลค่า
                  </PdfText>
                  <PdfView style={{ marginTop: 6 }}>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>มูลค่าต้น</PdfText>
                      <PdfText>{formatCurrency(loan.propertyValue || 0)}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>มูลค่าปรับอุปสงค์</PdfText>
                      <PdfText>{formatCurrency((loan.propertyValue || 0) * 0.92)}</PdfText>
                    </PdfView>
                    <PdfView style={{ backgroundColor: '#f3f4f6', padding: 8, marginTop: 6 }}>
                      <PdfView style={pdfStyles.rowBetween}>
                        <PdfText style={{ fontSize: 19, fontWeight: 700 }}>มูลค่าประเมินสุทธิ</PdfText>
                        <PdfText style={{ fontSize: 28, fontWeight: 700 }}>
                          {formatCurrency(netValue)}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 170, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    สรุปการเปรียบเทียบตลาด
                  </PdfText>
                  <PdfView style={{ marginTop: 6 }}>
                    <PdfView style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 5 }}>
                      <PdfText style={{ width: '12%', textAlign: 'center', fontWeight: 700 }}>ลำดับ</PdfText>
                      <PdfText style={{ width: '58%', fontWeight: 700 }}>ทรัพย์จดเทียบเคียง</PdfText>
                      <PdfText style={{ width: '30%', textAlign: 'right', fontWeight: 700 }}>ราคาขาย</PdfText>
                    </PdfView>
                    {compareRows.map((r, idx) => (
                      <PdfView
                        key={r[0]}
                        style={{
                          flexDirection: 'row',
                          paddingVertical: 5,
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        }}
                      >
                        <PdfText style={{ width: '12%', textAlign: 'center' }}>{r[0]}</PdfText>
                        <PdfText style={{ width: '58%' }}>{r[1]}</PdfText>
                        <PdfText style={{ width: '30%', textAlign: 'right' }}>{formatCurrency(Number(r[2]))}</PdfText>
                      </PdfView>
                    ))}
                    <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 4 }}>
                      <PdfText style={{ fontWeight: 700 }}>ค่ายสื่อกลาง</PdfText>
                      <PdfText style={{ fontWeight: 700 }}>{formatCurrency(netValue * 0.96)}</PdfText>
                    </PdfView>
                  </PdfView>
                </PdfView>
              </PdfView>

              <PdfView style={{ width: '39%' }}>
                <PdfView style={{ ...pdfStyles.box, height: 190, justifyContent: 'center', alignItems: 'center' }}>
                  <PdfText style={{ color: '#6b7280' }}>แผนผังที่ดิน (Placeholder)</PdfText>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 130, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    รายละเอียดการประเมิน
                  </PdfText>
                  <PdfView style={{ marginTop: 6 }}>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ราคาที่ดิน</PdfText>
                      <PdfText>{formatCurrency((loan.propertyValue || 0) * 0.55)}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>สิ่งปลูกสร้าง</PdfText>
                      <PdfText>{formatCurrency((loan.propertyValue || 0) * 0.40)}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ค่าเสื่อม/ปรับปรุง</PdfText>
                      <PdfText>-{formatCurrency((loan.propertyValue || 0) * 0.03)}</PdfText>
                    </PdfView>
                    <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                      <PdfText style={{ fontWeight: 700 }}>รวม</PdfText>
                      <PdfText style={{ fontWeight: 700 }}>{formatCurrency(netValue)}</PdfText>
                    </PdfView>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 80, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    กฎ.หมายเหตุ
                  </PdfText>
                  <PdfText style={{ marginTop: 6, fontSize: 11 }}>
                    • ราคาประเมินเพื่อใช้ประกอบการพิจารณาสินเชื่อ
                  </PdfText>
                  <PdfText style={{ marginTop: 4, fontSize: 11 }}>
                    • อ้างอิงจากราคาตลาดและสภาพทรัพย์ปัจจุบัน
                  </PdfText>
                  <PdfText style={{ marginTop: 4, fontSize: 11 }}>
                    • ค่าประเมินอาจเปลี่ยนแปลงตามภาวะตลาด
                  </PdfText>
                </PdfView>

                <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <PdfView
                      key={n}
                      style={{
                        width: '48%',
                        height: 70,
                        borderWidth: 1,
                        borderColor: '#d1d5db',
                        borderStyle: 'solid',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <PdfText style={{ fontSize: 10, color: '#6b7280' }}>รูปทรัพย์ {n}</PdfText>
                    </PdfView>
                  ))}
                </PdfView>
              </PdfView>
            </PdfView>

            <PdfView style={{ marginTop: 20, alignItems: 'flex-end' }}>
              <PdfView style={{ width: 280, borderBottomWidth: 1, borderBottomColor: '#6b7280', borderBottomStyle: 'dashed', paddingBottom: 18 }}>
                <PdfText style={{ textAlign: 'center', color: '#6b7280' }}>
                  วันที่ ......... เดือน ......... พ.ศ. .........
                </PdfText>
              </PdfView>
            </PdfView>
          </PdfPage>
        );

        return [receiptPage, closeCasePage, appraisalPage];
      })}
    </PdfDocument>
  );
}
*/
