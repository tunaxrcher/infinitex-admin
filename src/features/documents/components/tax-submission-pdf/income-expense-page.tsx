import {
  Image as PdfImage,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  type IncomeExpenseItem,
  pdfStyles,
} from './shared';
import { format } from 'date-fns';

/**
 * Format date to dd/MM/yyyy in CE (ค.ศ.).
 * ข้อมูลวันที่จาก DB อาจเก็บเป็นปี พ.ศ. (year > 2400)
 * ฟังก์ชันนี้จะแปลงเป็น ค.ศ. ให้อัตโนมัติ
 */
function formatDateCE(value?: string | Date | null): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    const year = d.getFullYear();
    if (year > 2400) {
      d.setFullYear(year - 543);
    }
    return format(d, 'dd/MM/yyyy');
  } catch {
    return '-';
  }
}

function resolveIncomeDetail(item: IncomeExpenseItem): string {
  const propertyType = item.propertyType || '';
  const normalizedPlaceNames = (item.allPlaceNames || [])
    .map((n) =>
      String(n || '')
        .trim()
        .replace(/\s+/g, ' '),
    )
    .filter((n) => n && n !== '-');
  const placeName = String(item.placeName || '')
    .trim()
    .replace(/\s+/g, ' ');
  const isMultipleDeed = Number(item.titleDeedCount || 0) > 1;
  const placeDisplay = isMultipleDeed
    ? `โฉนดชุด (${normalizedPlaceNames.join(', ') || placeName || '-'})`
    : placeName || normalizedPlaceNames[0] || '-';
  return [propertyType, placeDisplay].filter(Boolean).join(' ').trim() || '-';
}

function resolveExpenseDetail(item: IncomeExpenseItem): string {
  return [item.title, item.note].filter(Boolean).join(' ').trim() || '-';
}

/* ══════════════════════════════════════════════════════════════════════════ */

export function IncomeExpensePage({
  items,
  monthName,
  buddhistYear,
  fontFamily,
  logoSrc,
}: {
  items: IncomeExpenseItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
  logoSrc?: string | null;
}) {
  const ceYear = buddhistYear - 543;
  const incomeItems = items.filter((i) => i.type === 'income');
  const expenseItems = items.filter((i) => i.type === 'expense');
  const totalIncome = incomeItems.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0,
  );
  const totalExpense = expenseItems.reduce(
    (sum, i) => sum + Number(i.amount || 0),
    0,
  );
  const netTotal = totalIncome - totalExpense;
  const reportDate = formatDateCE(new Date());

  const pageStyle = [pdfStyles.page, { fontFamily }] as any;

  /* ── fixed header height ≈ 100 px (logo 48 + gap + section title + table header) ── */
  const fixedHeaderTop = 24;
  const contentPaddingTop = 130;

  return (
    <>
      {/* ══════ PAGE 1: Summary ══════ */}
      <PdfPage size="A4" style={pageStyle}>
        {/* Company header */}
        <PdfView
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
          }}
        >
          <PdfView style={{ width: '35%' }}>
            {logoSrc && (
              <PdfImage
                src={logoSrc}
                style={{ width: 140, height: 48, objectFit: 'contain' }}
              />
            )}
          </PdfView>
          <PdfView style={{ width: '63%' }}>
            <PdfText
              style={{ fontSize: 26, fontWeight: 700, textAlign: 'right' }}
            >
              บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด
            </PdfText>
            <PdfText
              style={{
                ...pdfStyles.muted,
                ...pdfStyles.textRight,
                marginTop: 3,
              }}
            >
              ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง
            </PdfText>
            <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
              อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
            </PdfText>
          </PdfView>
        </PdfView>

        {/* Title + Summary boxes */}
        <PdfView
          style={{ ...pdfStyles.rowBetween, alignItems: 'stretch' }}
        >
          {/* Left: title box (68%) */}
          <PdfView style={{ ...pdfStyles.box, width: '68%', minHeight: 100 }}>
            <PdfText style={{ fontSize: 16, fontWeight: 700 }}>
              ใบสรุปยอดรับ-จ่ายประจำเดือน{' '}
              <PdfText style={{ fontSize: 12, color: '#6b7280' }}>
                Monthly Receipt &amp; Payment Statement
              </PdfText>
            </PdfText>
            <PdfText style={{ marginTop: 10, fontSize: 11 }}>
              ประจำเดือน: {monthName}/{ceYear}
            </PdfText>
            <PdfText style={{ fontSize: 11 }}>
              วันที่พิมพ์รายงาน: {reportDate}
            </PdfText>
            <PdfText
              style={{ marginTop: 10, fontSize: 9, color: '#6b7280' }}
            >
              ทะเบียนเลขที่ / Registration No. 0345568003383
            </PdfText>
            <PdfText style={{ fontSize: 9, color: '#6b7280' }}>
              เลขประจำตัวผู้เสียภาษี / Tax ID. 0345568003383
            </PdfText>
            <PdfText style={{ fontSize: 9, color: '#6b7280' }}>
              เลขที่สาขา 00000
            </PdfText>
          </PdfView>

          {/* Right: summary box (30%) */}
          <PdfView style={{ ...pdfStyles.box, width: '30%', minHeight: 100 }}>
            <PdfText
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#1d4ed8',
                marginBottom: 6,
              }}
            >
              สรุปภาพรวม / Summary
            </PdfText>
            <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 2 }}>
              <PdfView>
                <PdfText style={{ fontSize: 10 }}>รวมยอดรับทั้งเดือน</PdfText>
                <PdfText style={{ fontSize: 7, color: '#6b7280' }}>
                  Total Receipts
                </PdfText>
              </PdfView>
              <PdfText style={{ fontSize: 10 }}>
                {formatCurrency(totalIncome)} บาท
              </PdfText>
            </PdfView>
            <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 2 }}>
              <PdfView>
                <PdfText style={{ fontSize: 10 }}>
                  รวมยอดจ่ายทั้งเดือน
                </PdfText>
                <PdfText style={{ fontSize: 7, color: '#6b7280' }}>
                  Total Payments
                </PdfText>
              </PdfView>
              <PdfText style={{ fontSize: 10 }}>
                {formatCurrency(totalExpense)} บาท
              </PdfText>
            </PdfView>
            <PdfView
              style={{
                ...pdfStyles.rowBetween,
                paddingVertical: 2,
                borderTopWidth: 1,
                borderTopColor: '#d1d5db',
                borderTopStyle: 'solid',
                marginTop: 3,
              }}
            >
              <PdfView>
                <PdfText style={{ fontSize: 10, fontWeight: 700 }}>
                  ยอดสุทธิ (รับ - จ่าย)
                </PdfText>
                <PdfText style={{ fontSize: 7, color: '#6b7280' }}>
                  Net (Receipts - Payments)
                </PdfText>
              </PdfView>
              <PdfText
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: netTotal >= 0 ? '#16a34a' : '#dc2626',
                }}
              >
                {formatCurrency(netTotal)} บาท
              </PdfText>
            </PdfView>
            <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 2 }}>
              <PdfText style={{ fontSize: 10 }}>
                กำไรสุทธิ / Net Profit
              </PdfText>
            </PdfView>
          </PdfView>
        </PdfView>
      </PdfPage>

      {/* ══════ Income pages (fixed header repeats on every page) ══════ */}
      <PdfPage
        size="A4"
        style={[pageStyle, { paddingTop: contentPaddingTop }]}
      >
        {/* Fixed header: company + section title + table columns */}
        <PdfView
          fixed
          style={{
            position: 'absolute',
            top: fixedHeaderTop,
            left: 20,
            right: 20,
          }}
        >
          <PdfView
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 6,
            }}
          >
            <PdfView style={{ width: '35%' }}>
              {logoSrc && (
                <PdfImage
                  src={logoSrc}
                  style={{ width: 140, height: 48, objectFit: 'contain' }}
                />
              )}
            </PdfView>
            <PdfView style={{ width: '63%' }}>
              <PdfText
                style={{ fontSize: 26, fontWeight: 700, textAlign: 'right' }}
              >
                บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด
              </PdfText>
              <PdfText
                style={{
                  ...pdfStyles.muted,
                  ...pdfStyles.textRight,
                  marginTop: 3,
                }}
              >
                ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง
              </PdfText>
              <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
              </PdfText>
            </PdfView>
          </PdfView>

          <PdfText
            style={{
              color: '#1d4ed8',
              fontSize: 16,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            รายการรับ / Receipts
          </PdfText>

          <PdfView
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderTopColor: '#111827',
              borderBottomColor: '#111827',
              borderTopStyle: 'solid',
              borderBottomStyle: 'solid',
              paddingVertical: 6,
              marginTop: 4,
            }}
          >
            <PdfText
              style={{
                width: '6%',
                fontSize: 10,
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              #
            </PdfText>
            <PdfText
              style={{ width: '16%', fontSize: 10, textAlign: 'center' }}
            >
              เลขที่{'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Finx No.
              </PdfText>
            </PdfText>
            <PdfText
              style={{ width: '14%', fontSize: 10, textAlign: 'center' }}
            >
              วันที่{'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Date</PdfText>
            </PdfText>
            <PdfText
              style={{ width: '44%', fontSize: 10, textAlign: 'center' }}
            >
              รายละเอียด{'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Details
              </PdfText>
            </PdfText>
            <PdfText
              style={{ width: '20%', fontSize: 10, textAlign: 'right' }}
            >
              จำนวนเงิน (บาท){'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Amount (THB)
              </PdfText>
            </PdfText>
          </PdfView>
        </PdfView>

        {/* Flowing content: income rows */}
        {incomeItems.length > 0 ? (
          incomeItems.map((item, idx) => (
            <PdfView
              key={`inc-${item.id}`}
              wrap={false}
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                borderBottomWidth: 0.5,
                borderBottomColor: '#e5e7eb',
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText
                style={{ width: '6%', fontSize: 10, textAlign: 'center' }}
              >
                {idx + 1}
              </PdfText>
              <PdfText
                style={{ width: '16%', fontSize: 10, textAlign: 'center' }}
              >
                {item.loanNumber || '-'}
              </PdfText>
              <PdfText
                style={{ width: '14%', fontSize: 10, textAlign: 'center' }}
              >
                {formatDateCE(item.date)}
              </PdfText>
              <PdfText style={{ width: '44%', fontSize: 10 }}>
                {resolveIncomeDetail(item)}
              </PdfText>
              <PdfText
                style={{ width: '20%', fontSize: 10, textAlign: 'right' }}
              >
                {formatCurrency(item.amount)}
              </PdfText>
            </PdfView>
          ))
        ) : (
          <PdfView style={{ paddingVertical: 8 }}>
            <PdfText
              style={{ fontSize: 10, textAlign: 'center', color: '#6b7280' }}
            >
              - ไม่มีรายการรับในเดือนนี้ -
            </PdfText>
          </PdfView>
        )}

        {/* Income total */}
        <PdfView
          style={{
            flexDirection: 'row',
            paddingVertical: 6,
            borderTopWidth: 1,
            borderTopColor: '#111827',
            borderTopStyle: 'solid',
          }}
        >
          <PdfText
            style={{
              width: '80%',
              fontSize: 11,
              textAlign: 'right',
              fontWeight: 700,
            }}
          >
            รวมรายการรับทั้งหมด / Total Receipts
          </PdfText>
          <PdfText
            style={{
              width: '20%',
              fontSize: 11,
              textAlign: 'right',
              fontWeight: 700,
            }}
          >
            {formatCurrency(totalIncome)}
          </PdfText>
        </PdfView>
      </PdfPage>

      {/* ══════ Expense pages (fixed header repeats on every page) ══════ */}
      <PdfPage
        size="A4"
        style={[pageStyle, { paddingTop: contentPaddingTop }]}
      >
        {/* Fixed header: company + section title + table columns */}
        <PdfView
          fixed
          style={{
            position: 'absolute',
            top: fixedHeaderTop,
            left: 20,
            right: 20,
          }}
        >
          <PdfView
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 6,
            }}
          >
            <PdfView style={{ width: '35%' }}>
              {logoSrc && (
                <PdfImage
                  src={logoSrc}
                  style={{ width: 140, height: 48, objectFit: 'contain' }}
                />
              )}
            </PdfView>
            <PdfView style={{ width: '63%' }}>
              <PdfText
                style={{ fontSize: 26, fontWeight: 700, textAlign: 'right' }}
              >
                บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด
              </PdfText>
              <PdfText
                style={{
                  ...pdfStyles.muted,
                  ...pdfStyles.textRight,
                  marginTop: 3,
                }}
              >
                ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง
              </PdfText>
              <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
              </PdfText>
            </PdfView>
          </PdfView>

          <PdfText
            style={{
              color: '#1d4ed8',
              fontSize: 16,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            รายการจ่าย / Payments
          </PdfText>

          <PdfView
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderTopColor: '#111827',
              borderBottomColor: '#111827',
              borderTopStyle: 'solid',
              borderBottomStyle: 'solid',
              paddingVertical: 6,
              marginTop: 4,
            }}
          >
            <PdfText
              style={{
                width: '6%',
                fontSize: 10,
                textAlign: 'center',
                fontWeight: 700,
              }}
            >
              #
            </PdfText>
            <PdfText
              style={{ width: '16%', fontSize: 10, textAlign: 'center' }}
            >
              เลขที่{'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Document No.
              </PdfText>
            </PdfText>
            <PdfText
              style={{ width: '14%', fontSize: 10, textAlign: 'center' }}
            >
              วันที่{'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Date</PdfText>
            </PdfText>
            <PdfText
              style={{ width: '44%', fontSize: 10, textAlign: 'center' }}
            >
              รายละเอียด{'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Details
              </PdfText>
            </PdfText>
            <PdfText
              style={{ width: '20%', fontSize: 10, textAlign: 'right' }}
            >
              จำนวนเงิน (บาท){'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Amount (THB)
              </PdfText>
            </PdfText>
          </PdfView>
        </PdfView>

        {/* Flowing content: expense rows */}
        {expenseItems.length > 0 ? (
          expenseItems.map((item, idx) => (
            <PdfView
              key={`exp-${item.id}`}
              wrap={false}
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                borderBottomWidth: 0.5,
                borderBottomColor: '#e5e7eb',
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText
                style={{ width: '6%', fontSize: 10, textAlign: 'center' }}
              >
                {idx + 1}
              </PdfText>
              <PdfText
                style={{ width: '16%', fontSize: 10, textAlign: 'center' }}
              >
                {item.docNumber || '-'}
              </PdfText>
              <PdfText
                style={{ width: '14%', fontSize: 10, textAlign: 'center' }}
              >
                {formatDateCE(item.date)}
              </PdfText>
              <PdfText style={{ width: '44%', fontSize: 10 }}>
                {resolveExpenseDetail(item)}
              </PdfText>
              <PdfText
                style={{ width: '20%', fontSize: 10, textAlign: 'right' }}
              >
                {formatCurrency(item.amount)}
              </PdfText>
            </PdfView>
          ))
        ) : (
          <PdfView style={{ paddingVertical: 8 }}>
            <PdfText
              style={{ fontSize: 10, textAlign: 'center', color: '#6b7280' }}
            >
              - ไม่มีรายการจ่ายในเดือนนี้ -
            </PdfText>
          </PdfView>
        )}

        {/* Expense total */}
        <PdfView
          style={{
            flexDirection: 'row',
            paddingVertical: 6,
            borderTopWidth: 1,
            borderTopColor: '#111827',
            borderTopStyle: 'solid',
          }}
        >
          <PdfText
            style={{
              width: '80%',
              fontSize: 11,
              textAlign: 'right',
              fontWeight: 700,
            }}
          >
            รวมรายการจ่ายทั้งหมด / Total Payments
          </PdfText>
          <PdfText
            style={{
              width: '20%',
              fontSize: 11,
              textAlign: 'right',
              fontWeight: 700,
              color: '#dc2626',
            }}
          >
            {formatCurrency(totalExpense)}
          </PdfText>
        </PdfView>

        {/* ── Footer: Net total ── */}
        <PdfView
          style={{
            flexDirection: 'row',
            paddingVertical: 8,
            marginTop: 10,
            borderTopWidth: 2,
            borderTopColor: '#111827',
            borderTopStyle: 'solid',
            borderBottomWidth: 2,
            borderBottomColor: '#111827',
            borderBottomStyle: 'solid',
          }}
        >
          <PdfText
            style={{
              width: '80%',
              fontSize: 13,
              textAlign: 'right',
              fontWeight: 700,
            }}
          >
            ยอดสุทธิ (รับ - จ่าย) / Net
          </PdfText>
          <PdfText
            style={{
              width: '20%',
              fontSize: 13,
              textAlign: 'right',
              fontWeight: 700,
              color: netTotal >= 0 ? '#16a34a' : '#dc2626',
            }}
          >
            {formatCurrency(netTotal)}
          </PdfText>
        </PdfView>
      </PdfPage>
    </>
  );
}
