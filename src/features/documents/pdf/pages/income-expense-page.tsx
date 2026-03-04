import {
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  pdfStyles,
  type IncomeExpenseItem,
} from '../shared';
import { CompanyHeader } from '../shared/components';

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
  const reportDate = formatDateOrDash(new Date());

  /* ── layout constants ── */
  const pagePadTop = 24;
  const pagePadH = 20;
  const fixedHeaderHeight = 140;
  const contentPaddingTop = pagePadTop + fixedHeaderHeight;

  const tablePageStyle = {
    paddingTop: contentPaddingTop,
    paddingBottom: 20,
    paddingHorizontal: pagePadH,
    fontSize: 12,
    color: '#1f2937',
    fontFamily,
  } as any;

  /* shared column-header styles */
  const colHeaderRow = {
    flexDirection: 'row' as const,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#111827',
    borderBottomColor: '#111827',
    borderTopStyle: 'solid' as const,
    borderBottomStyle: 'solid' as const,
    paddingVertical: 6,
    marginTop: 4,
  };

  return (
    <>
      {/* ══════ Summary + Income (page 1 shows summary, pages 2+ show fixed header) ══════ */}
      <PdfPage size="A4" style={tablePageStyle}>
        {/* Fixed header: repeats on every page of the income section */}
        <PdfView
          fixed
          style={{
            position: 'absolute',
            top: pagePadTop,
            left: pagePadH,
            right: pagePadH,
          }}
        >
          <CompanyHeader logoSrc={logoSrc} marginBottom={6} />
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
          <PdfView style={colHeaderRow}>
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
            <PdfText style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>
              จำนวนเงิน (บาท){'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Amount (THB)
              </PdfText>
            </PdfText>
          </PdfView>
        </PdfView>

        {/* Page-1 overlay: covers fixed header with summary + income section start */}
        <PdfView
          wrap={false}
          style={{
            marginTop: -fixedHeaderHeight,
            backgroundColor: 'white',
          }}
        >
          <CompanyHeader logoSrc={logoSrc} />

          {/* Title + Summary boxes */}
          <PdfView
            style={{
              ...pdfStyles.rowBetween,
              marginTop: 18,
              alignItems: 'stretch',
            }}
          >
            {/* Left: title box */}
            <PdfView style={{ ...pdfStyles.box, width: '49%', minHeight: 100 }}>
              <PdfText style={{ fontSize: 16, fontWeight: 700 }}>
                ใบสรุปยอดรับ-จ่ายประจำเดือน{' '}
                <PdfText style={{ fontSize: 12, color: '#6b7280' }}>
                  Monthly Receipt &amp; Payment Statement
                </PdfText>
              </PdfText>
              <PdfText style={{ marginTop: 10, fontSize: 11 }}>
                ประจำเดือน: {monthName} {buddhistYear}
              </PdfText>
              <PdfText style={{ fontSize: 11 }}>
                วันที่พิมพ์รายงาน: {reportDate}
              </PdfText>
              <PdfText style={{ marginTop: 10, fontSize: 9, color: '#6b7280' }}>
                ทะเบียนเลขที่ / Registration No. 0345568003383
              </PdfText>
              <PdfText style={{ fontSize: 9, color: '#6b7280' }}>
                เลขประจำตัวผู้เสียภาษี / Tax ID. 0345568003383
              </PdfText>
              <PdfText style={{ fontSize: 9, color: '#6b7280' }}>
                เลขที่สาขา 00000
              </PdfText>
            </PdfView>

            {/* Right: summary box */}
            <PdfView style={{ ...pdfStyles.box, width: '49%', minHeight: 100 }}>
              <PdfText
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#1d4ed8',
                  marginBottom: 8,
                }}
              >
                สรุปภาพรวม / Summary
              </PdfText>
              <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                <PdfView>
                  <PdfText style={{ fontSize: 11 }}>รวมยอดรับทั้งเดือน</PdfText>
                  <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                    Total Receipts
                  </PdfText>
                </PdfView>
                <PdfText style={{ fontSize: 11 }}>
                  {formatCurrency(totalIncome)} บาท
                </PdfText>
              </PdfView>
              <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                <PdfView>
                  <PdfText style={{ fontSize: 11 }}>
                    รวมยอดจ่ายทั้งเดือน
                  </PdfText>
                  <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                    Total Payments
                  </PdfText>
                </PdfView>
                <PdfText style={{ fontSize: 11 }}>
                  {formatCurrency(totalExpense)} บาท
                </PdfText>
              </PdfView>
              <PdfView
                style={{
                  ...pdfStyles.rowBetween,
                  paddingVertical: 3,
                  borderTopWidth: 1,
                  borderTopColor: '#d1d5db',
                  borderTopStyle: 'solid',
                  marginTop: 4,
                }}
              >
                <PdfView>
                  <PdfText style={{ fontSize: 11, fontWeight: 700 }}>
                    ยอดสุทธิ (รับ - จ่าย)
                  </PdfText>
                  <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                    Net (Receipts - Payments)
                  </PdfText>
                </PdfView>
                <PdfText
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: netTotal >= 0 ? '#16a34a' : '#dc2626',
                  }}
                >
                  {formatCurrency(netTotal)} บาท
                </PdfText>
              </PdfView>
              <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                <PdfView>
                  <PdfText style={{ fontSize: 11 }}>
                    กำไรสุทธิ / Net Profit
                  </PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
          </PdfView>

          {/* Income section title + column headers (in flow for page 1) */}
          <PdfText
            style={{
              color: '#1d4ed8',
              fontSize: 16,
              fontWeight: 700,
              marginTop: 20,
            }}
          >
            รายการรับ / Receipts
          </PdfText>
          <PdfView style={colHeaderRow}>
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
            <PdfText style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>
              จำนวนเงิน (บาท){'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Amount (THB)
              </PdfText>
            </PdfText>
          </PdfView>
        </PdfView>

        {/* Income rows */}
        {incomeItems.length > 0 ? (
          incomeItems.map((item, idx) => (
            <PdfView
              key={`inc-${item.id}`}
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
                {formatDateOrDash(item.date)}
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

      {/* ══════ Expense (separate page with its own fixed header) ══════ */}
      <PdfPage size="A4" style={tablePageStyle}>
        {/* Fixed header: repeats on every page of the expense section */}
        <PdfView
          fixed
          style={{
            position: 'absolute',
            top: pagePadTop,
            left: pagePadH,
            right: pagePadH,
          }}
        >
          <CompanyHeader logoSrc={logoSrc} marginBottom={6} />
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
          <PdfView style={colHeaderRow}>
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
            <PdfText style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>
              จำนวนเงิน (บาท){'\n'}
              <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
                Amount (THB)
              </PdfText>
            </PdfText>
          </PdfView>
        </PdfView>

        {/* Expense rows */}
        {expenseItems.length > 0 ? (
          expenseItems.map((item, idx) => (
            <PdfView
              key={`exp-${item.id}`}
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
                {formatDateOrDash(item.date)}
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

        {/* Net total footer */}
        <PdfView
          style={{
            flexDirection: 'row',
            paddingVertical: 8,
            marginTop: 6,
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
              fontSize: 12,
              textAlign: 'right',
              fontWeight: 700,
            }}
          >
            ยอดสุทธิ (รับ - จ่าย) / Net
          </PdfText>
          <PdfText
            style={{
              width: '20%',
              fontSize: 12,
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
