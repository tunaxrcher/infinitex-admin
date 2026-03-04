import {
  Image as PdfImage,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  type IncomeExpenseItem,
  pdfStyles,
} from './shared';

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

/* ── Shared sub-components ── */

function CompanyHeader({
  logoSrc,
}: {
  logoSrc?: string | null;
}) {
  return (
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
          style={{ ...pdfStyles.muted, ...pdfStyles.textRight, marginTop: 3 }}
        >
          ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง
        </PdfText>
        <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
          อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
        </PdfText>
      </PdfView>
    </PdfView>
  );
}

function ReceiptsTableHeader() {
  return (
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
        style={{ width: '6%', fontSize: 10, textAlign: 'center', fontWeight: 700 }}
      >
        #
      </PdfText>
      <PdfText style={{ width: '16%', fontSize: 10, textAlign: 'center' }}>
        เลขที่{'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Finx No.</PdfText>
      </PdfText>
      <PdfText style={{ width: '14%', fontSize: 10, textAlign: 'center' }}>
        วันที่{'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Date</PdfText>
      </PdfText>
      <PdfText style={{ width: '44%', fontSize: 10, textAlign: 'center' }}>
        รายละเอียด{'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Details</PdfText>
      </PdfText>
      <PdfText style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>
        จำนวนเงิน (บาท){'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
          Amount (THB)
        </PdfText>
      </PdfText>
    </PdfView>
  );
}

function PaymentsTableHeader() {
  return (
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
        style={{ width: '6%', fontSize: 10, textAlign: 'center', fontWeight: 700 }}
      >
        #
      </PdfText>
      <PdfText style={{ width: '16%', fontSize: 10, textAlign: 'center' }}>
        เลขที่{'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
          Document No.
        </PdfText>
      </PdfText>
      <PdfText style={{ width: '14%', fontSize: 10, textAlign: 'center' }}>
        วันที่{'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Date</PdfText>
      </PdfText>
      <PdfText style={{ width: '44%', fontSize: 10, textAlign: 'center' }}>
        รายละเอียด{'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>Details</PdfText>
      </PdfText>
      <PdfText style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>
        จำนวนเงิน (บาท){'\n'}
        <PdfText style={{ fontSize: 8, color: '#6b7280' }}>
          Amount (THB)
        </PdfText>
      </PdfText>
    </PdfView>
  );
}

/* ── Main component: renders multiple pages ── */

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

  // Split items into chunks that fit on pages.
  // First page has ~18 rows available (header+summary takes space).
  // Subsequent pages have ~28 rows (only company header + table header).
  const FIRST_PAGE_ROWS = 18;
  const CONT_PAGE_ROWS = 28;

  // Build chunks for income section
  const incomeChunks: IncomeExpenseItem[][] = [];
  if (incomeItems.length === 0) {
    incomeChunks.push([]);
  } else {
    let remaining = [...incomeItems];
    // First chunk (on page 1 with summary)
    incomeChunks.push(remaining.splice(0, FIRST_PAGE_ROWS));
    while (remaining.length > 0) {
      incomeChunks.push(remaining.splice(0, CONT_PAGE_ROWS));
    }
  }

  // Build chunks for expense section
  const expenseChunks: IncomeExpenseItem[][] = [];
  if (expenseItems.length === 0) {
    expenseChunks.push([]);
  } else {
    let remaining = [...expenseItems];
    expenseChunks.push(remaining.splice(0, CONT_PAGE_ROWS));
    while (remaining.length > 0) {
      expenseChunks.push(remaining.splice(0, CONT_PAGE_ROWS));
    }
  }

  const pageStyle = [pdfStyles.page, { fontFamily }] as any;

  return (
    <>
      {/* ══════ PAGE 1: Summary + first income chunk ══════ */}
      <PdfPage size="A4" style={pageStyle}>
        <CompanyHeader logoSrc={logoSrc} />

        {/* Title + Summary boxes */}
        <PdfView
          style={{
            ...pdfStyles.rowBetween,
            alignItems: 'stretch',
          }}
        >
          {/* Left: title box — wider (68%) */}
          <PdfView style={{ ...pdfStyles.box, width: '68%', minHeight: 100 }}>
            <PdfText style={{ fontSize: 16, fontWeight: 700 }}>
              ใบสรุปยอดรับ-จ่ายประจำเดือน{' '}
              <PdfText style={{ fontSize: 12, color: '#6b7280' }}>
                Monthly Receipt &amp; Payment Statement
              </PdfText>
            </PdfText>
            <PdfText style={{ marginTop: 10, fontSize: 11 }}>
              ประจำเดือน: {monthName}/{buddhistYear - 543}
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

          {/* Right: summary box — narrower (30%) */}
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
                <PdfText style={{ fontSize: 10 }}>รวมยอดจ่ายทั้งเดือน</PdfText>
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

        {/* Receipts section title */}
        <PdfText
          style={{
            color: '#1d4ed8',
            fontSize: 16,
            fontWeight: 700,
            marginTop: 16,
          }}
        >
          รายการรับ / Receipts
        </PdfText>

        <ReceiptsTableHeader />

        {/* First chunk of income rows */}
        {incomeChunks[0].length > 0 ? (
          incomeChunks[0].map((item, idx) => (
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
              <PdfText style={{ width: '6%', fontSize: 10, textAlign: 'center' }}>
                {idx + 1}
              </PdfText>
              <PdfText style={{ width: '16%', fontSize: 10, textAlign: 'center' }}>
                {item.loanNumber || '-'}
              </PdfText>
              <PdfText style={{ width: '14%', fontSize: 10, textAlign: 'center' }}>
                {formatDateOrDash(item.date)}
              </PdfText>
              <PdfText style={{ width: '44%', fontSize: 10 }}>
                ที่ดิน{resolveIncomeDetail(item)}
              </PdfText>
              <PdfText style={{ width: '20%', fontSize: 10, textAlign: 'right' }}>
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

        {/* If income fits on 1 page, show total here */}
        {incomeChunks.length === 1 && (
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
        )}
      </PdfPage>

      {/* ══════ Continuation pages for income (if needed) ══════ */}
      {incomeChunks.slice(1).map((chunk, pageIdx) => {
        const isLastIncomePage = pageIdx === incomeChunks.length - 2;
        const baseIdx = FIRST_PAGE_ROWS + pageIdx * CONT_PAGE_ROWS;
        return (
          <PdfPage key={`inc-page-${pageIdx}`} size="A4" style={pageStyle}>
            <CompanyHeader logoSrc={logoSrc} />
            <PdfText
              style={{
                color: '#1d4ed8',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              รายการรับ / Receipts (ต่อ)
            </PdfText>
            <ReceiptsTableHeader />
            {chunk.map((item, idx) => (
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
                  {baseIdx + idx + 1}
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
                  ที่ดิน{resolveIncomeDetail(item)}
                </PdfText>
                <PdfText
                  style={{ width: '20%', fontSize: 10, textAlign: 'right' }}
                >
                  {formatCurrency(item.amount)}
                </PdfText>
              </PdfView>
            ))}
            {isLastIncomePage && (
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
            )}
          </PdfPage>
        );
      })}

      {/* ══════ Expense pages ══════ */}
      {expenseChunks.map((chunk, pageIdx) => {
        const isFirstExpensePage = pageIdx === 0;
        const isLastExpensePage = pageIdx === expenseChunks.length - 1;
        const baseIdx = pageIdx * CONT_PAGE_ROWS;
        return (
          <PdfPage key={`exp-page-${pageIdx}`} size="A4" style={pageStyle}>
            <CompanyHeader logoSrc={logoSrc} />
            <PdfText
              style={{
                color: '#1d4ed8',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              รายการจ่าย / Payments
              {!isFirstExpensePage ? ' (ต่อ)' : ''}
            </PdfText>
            <PaymentsTableHeader />
            {chunk.length > 0 ? (
              chunk.map((item, idx) => (
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
                    {baseIdx + idx + 1}
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
                  style={{
                    fontSize: 10,
                    textAlign: 'center',
                    color: '#6b7280',
                  }}
                >
                  - ไม่มีรายการจ่ายในเดือนนี้ -
                </PdfText>
              </PdfView>
            )}

            {/* Expense total on last expense page */}
            {isLastExpensePage && (
              <>
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
              </>
            )}
          </PdfPage>
        );
      })}
    </>
  );
}
