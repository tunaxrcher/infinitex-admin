import {
  Image as PdfImage,
  Page as PdfPage,
  Polyline,
  Svg,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import { formatCurrency, TaxFeeLoanItem } from './shared';

// ── design tokens ─────────────────────────────────────────────────────────
const T = {
  text: '#111827',
  label: '#6b7280',
  border: '#e5e7eb',
  borderMid: '#d1d5db',
  bg: '#ffffff',
  bgStripe: '#f9fafb',
  primary: '#4f46e5',
  skyBlue: '#0ea5e9',
};

// ── Thai date helper ───────────────────────────────────────────────────────
const MONTHS_TH = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
function toThaiDate(value?: string | Date | null): string {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch { return '-'; }
}

// ── mini SVG line chart ────────────────────────────────────────────────────
function miniChartPoints(values: number[], w = 128, h = 36): string {
  const max = Math.max(...values, 1);
  const step = w / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(' ');
}

// ── shared tiny-components ─────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <PdfView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginTop: 8 }}>
      <PdfView style={{ width: 3, height: 11, backgroundColor: T.text, marginRight: 5, borderRadius: 1 }} />
      <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.text }}>{text}</PdfText>
    </PdfView>
  );
}

function RatioCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <PdfView
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: T.border,
        borderStyle: 'solid',
        borderRadius: 4,
        padding: 7,
        backgroundColor: T.bg,
      }}
    >
      <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>{title}</PdfText>
      <PdfText style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{value}</PdfText>
      <PdfText style={{ fontSize: 7, color: T.label, lineHeight: 1.3 }}>{subtitle}</PdfText>
    </PdfView>
  );
}

function PropRow({ label, value, stripe }: { label: string; value: string; stripe?: boolean }) {
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        backgroundColor: stripe ? T.bgStripe : T.bg,
        paddingVertical: 4,
        paddingHorizontal: 0,
      }}
    >
      <PdfText style={{ width: '46%', fontSize: 8, color: T.label }}>{label}</PdfText>
      <PdfText style={{ flex: 1, fontSize: 8, color: T.text, fontWeight: 700 }}>{value}</PdfText>
    </PdfView>
  );
}

// ── compute ratios ─────────────────────────────────────────────────────────
function computeRatios(loan: TaxFeeLoanItem) {
  const principal    = Number(loan.loanPrincipal   || 0); // ราคาขาย
  const approvedAmt  = Number(loan.approvedAmount  || 0); // วงเงินกู้ยืม
  const totalPropValue = Number(loan.totalPropertyValue || loan.propertyValue || 0); // ราคาประเมิน
  const feeRate   = Number(loan.taxRate   || 0);
  const feeAmount = Number(loan.feeAmount || 0);

  /**
   * NIM (Net Interest Margin) ในบริบทค่านายหน้า
   * สูตร: (รายได้สุทธิ ÷ ราคาขาย) × 100
   * ตัวอย่าง: (15,000 ÷ 1,200,000) × 100 = 1.25%
   */
  const nim = principal > 0 ? (feeAmount / principal) * 100 : 0;

  /**
   * LTV (Loan-to-Value)
   * สูตร: (วงเงินกู้ ÷ ราคาประเมิน) × 100
   * ตัวอย่าง: (300,000 ÷ 1,100,000) × 100 = 27.27%
   * ถ้าไม่มีราคาประเมิน: (วงเงินกู้ ÷ วงเงินกู้) × 100 = 100%
   */
  const ltvDenominator = totalPropValue > 0 ? totalPropValue : approvedAmt;
  const ltv = approvedAmt > 0 && ltvDenominator > 0
    ? (approvedAmt / ltvDenominator) * 100
    : null;

  const pToLoan = totalPropValue > 0 && principal > 0 ? totalPropValue / principal : 0;
  const remainingValue = totalPropValue > 0 ? totalPropValue - principal : 0;

  /**
   * ytdRealized — ผลตอบแทนจริงสะสม ณ ปัจจุบัน
   * ใช้สำหรับแสดงใน IRR row ของตาราง property details
   */
  const interestRate  = Number(loan.interestRate  || 0);
  const currentInst   = Number(loan.currentInstallment || 0);
  const ytdRealized   = principal > 0 && currentInst > 0
    ? (interestRate / 12) * currentInst
    : interestRate;

  // LTV subtitle
  const ltvSubtitle = totalPropValue > 0
    ? 'สัดส่วนเงินกู้เทียบกับราคาประเมิน'
    : 'ไม่มีราคาประเมิน — ใช้วงเงินกู้แทน';

  return { nim, ltv, ltvSubtitle, pToLoan, feeRate, feeAmount, remainingValue, totalPropValue, approvedAmt, ytdRealized };
}

// ── main component ─────────────────────────────────────────────────────────
export function CloseCasePage({ loan, fontFamily }: { loan: TaxFeeLoanItem; fontFamily: string }) {
  const primaryDeed = loan.titleDeeds?.find((d) => d.isPrimary) || loan.titleDeeds?.[0];

  // place name (product-list style)
  const normalizedAllPlaceNames = (loan.allPlaceNames || [])
    .map((n) => String(n || '').trim().replace(/\s+/g, ' '))
    .filter((n) => n && n !== '-');
  const placeNameFromLoan = String(loan.placeName || '').trim();
  const fallbackPlace =
    placeNameFromLoan ||
    normalizedAllPlaceNames[0] ||
    [primaryDeed?.amphurName, primaryDeed?.provinceName].filter(Boolean).join(' ').trim();
  const isMultipleDeed = (loan.titleDeeds?.length || 0) > 1;
  const placeDisplay = isMultipleDeed
    ? `โฉนดชุด (${normalizedAllPlaceNames.join(', ') || fallbackPlace || '-'})`
    : fallbackPlace || '-';
  const placeWithArea = primaryDeed?.landAreaText
    ? `${placeDisplay} (${primaryDeed.landAreaText})`
    : placeDisplay;

  const statusText =
    loan.loanStatus === 'ACTIVE' ? 'ยังไม่ถึงกำหนด'
    : loan.loanStatus === 'COMPLETED' ? 'ปิดการขาย'
    : loan.loanStatus === 'DEFAULTED' ? 'เกินกำหนดชำระ'
    : 'รออนุมัติ';

  const ratios = computeRatios(loan);
  const { approvedAmt: approvedAmount, totalPropValue } = ratios;

  // images — 1 main + 3 thumbnails
  const mainImageUrl = loan.primaryImageUrl || loan.titleDeeds?.[0]?.imageUrl || null;
  const thumbImages = [
    ...(loan.supportingImages || []),
    ...((loan.titleDeeds || []).slice(1).map((d) => d.imageUrl).filter(Boolean) as string[]),
  ].slice(0, 3);

  // chart data — real derived data (ไม่ใช่ demo ล้วนๆ)
  const termMonths = Number(loan.termMonths || 12);
  const remainingBalance = Number(loan.remainingBalance || 0);
  const principal = Number(loan.loanPrincipal || 0);
  const monthlyPay = Number(loan.monthlyPayment || principal / Math.max(termMonths, 1));

  /**
   * Chart 1 — สะสมค่าคอมมิชชั่น (commission realization over time)
   * แสดง: ค่าคอมสะสมทีละ period จากต้นจนถึงปัจจุบัน
   */
  const chart1Steps = 8;
  const feePerStep = ratios.feeAmount / chart1Steps;
  const chart1 = Array.from({ length: chart1Steps }, (_, i) => feePerStep * (i + 1));

  /**
   * Chart 2 — ยอดสินเชื่อคงเหลือ (remaining balance decreasing)
   * แสดง: ยอดเงินต้นที่ลดลงตามงวดชำระ โดยประมาณ
   */
  const chart2Steps = 8;
  const balanceNow = remainingBalance > 0 ? remainingBalance : principal;
  const balanceReduction = monthlyPay * Math.floor(termMonths / chart2Steps);
  const chart2 = Array.from({ length: chart2Steps }, (_, i) =>
    Math.max(0, balanceNow - balanceReduction * i),
  ).reverse(); // เริ่มจากสูงลงล่าง

  // property detail rows
  const propRows: Array<[string, string]> = [
    ['รหัสทรัพย์', loan.titleDeedNumber || primaryDeed?.deedNumber || loan.loanNumber || '-'],
    ['ที่ตั้ง', placeWithArea],
    ['ประเภท', primaryDeed?.landType || loan.propertyType || '-'],
    ['ค่าคอมมิชชั่น', `${ratios.feeRate.toFixed(2)}%`],
    ['อัตราส่วนเงินกู้', ratios.ltv !== null ? `${ratios.ltv.toFixed(2)}%` : '-'],
    ['ค่าคอมสุทธิ', `฿${formatCurrency(ratios.feeAmount)}`],
    ['IRR', '-'],
    ['IRR:', `${ratios.ytdRealized.toFixed(2)}% Lead`],
    ['ราคาประเมิน', totalPropValue > 0 ? `฿${formatCurrency(totalPropValue)}` : '-'],
    ['ราคาขาย', `฿${formatCurrency(loan.loanPrincipal || 0)}`],
    ['วงเงินกู้', approvedAmount > 0 ? `฿${formatCurrency(approvedAmount)}` : '-'],
    ['มูลค่าทรัพย์สินคงเหลือ', ratios.remainingValue > 0 ? `฿${formatCurrency(ratios.remainingValue)}` : '-'],
  ];

  return (
    <PdfPage
      key={`c-${loan.id}`}
      size="A4"
      style={{
        fontFamily,
        backgroundColor: T.bg,
        color: T.text,
        paddingHorizontal: 30,
        paddingVertical: 24,
        fontSize: 10,
      }}
    >
      {/* ── 1. HEADER ─────────────────────────────────────────────────── */}
      <PdfText style={{ fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 12 }}>
        ใบปิดเคสค่านายหน้า
      </PdfText>
      <PdfView style={{ borderTopWidth: 1, borderTopColor: T.borderMid, borderTopStyle: 'solid', marginBottom: 10 }} />

      {/* Customer name + REF */}
      <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <PdfText
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: T.text,
            borderBottomWidth: 1,
            borderBottomColor: T.text,
            borderBottomStyle: 'solid',
            paddingBottom: 1,
          }}
        >
          {loan.customerName || '-'}
        </PdfText>
        <PdfView
          style={{
            borderWidth: 1,
            borderColor: T.borderMid,
            borderStyle: 'solid',
            borderRadius: 3,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <PdfText style={{ fontSize: 9, fontWeight: 700, color: T.text }}>
            REF-{(loan.loanNumber || 'N/A').replace(/[^0-9A-Za-z]/g, '').slice(-10)}
          </PdfText>
        </PdfView>
      </PdfView>

      {/* Sub-info row: tax ID • วันที่ลงนามสัญญา */}
      <PdfText style={{ fontSize: 8, color: T.label, marginBottom: 12 }}>
        เลขประจำตัวผู้เสียภาษี : {loan.customerTaxId || '-'}
        {'   •   '}วันที่ลงนามสัญญา: {toThaiDate(loan.contractDate)}
        {'   •   '}วันที่สิ้นสุดสัญญา: {toThaiDate(loan.expiryDate)}
      </PdfText>

      {/* ── 2. MAIN CONTENT 58 / 42 ──────────────────────────────────── */}
      <PdfView style={{ flexDirection: 'row', gap: 14, flex: 1 }}>
        {/* ── LEFT 58% ── */}
        <PdfView style={{ width: '58%' }}>

          {/* 2.1 สรุปผล */}
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              padding: 10,
              marginBottom: 2,
              backgroundColor: T.bg,
            }}
          >
            <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.text, marginBottom: 8 }}>สรุปผล</PdfText>
            <PdfView style={{ flexDirection: 'row' }}>
              <PdfView style={{ flex: 1 }}>
                <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 4 }}>ราคาขาย</PdfText>
                <PdfText style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  ฿{Number(loan.loanPrincipal || 0).toLocaleString('th-TH')}
                </PdfText>
              </PdfView>
              <PdfView style={{ flex: 1 }}>
                <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 4 }}>วงเงิน</PdfText>
                <PdfText style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  ฿{formatCurrency(ratios.feeAmount)}
                  <PdfText style={{ fontSize: 11, fontWeight: 400 }}>
                    {' '}({ratios.feeRate.toFixed(2)}%)
                  </PdfText>
                </PdfText>
              </PdfView>
              <PdfView style={{ flex: 1 }}>
                <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 4 }}>สถานะ</PdfText>
                <PdfText style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{statusText}</PdfText>
              </PdfView>
            </PdfView>
          </PdfView>

          {/* 2.2 Core Financial Ratios (3 cards) */}
          <SectionLabel text="Core Financial Ratios" />
          <PdfView style={{ flexDirection: 'row', gap: 5, marginBottom: 2 }}>
            <RatioCard
              title="NIM"
              value={`${ratios.nim.toFixed(2)}%`}
              subtitle={`(${formatCurrency(ratios.feeAmount)} ÷ ${formatCurrency(principal)}) × 100`}
            />
            <RatioCard
              title="LTV"
              value={ratios.ltv !== null ? `${ratios.ltv.toFixed(1)}%` : '-'}
              subtitle={ratios.ltvSubtitle}
            />
            <RatioCard
              title="PT Loan"
              value={ratios.pToLoan > 0 ? `${ratios.pToLoan.toFixed(2)}x (Test)` : '-'}
              subtitle="สัดส่วนราคาทรัพย์สินคงเหลือกับวงเงินกู้"
            />
          </PdfView>

          {/* 2.3 Commission card */}
          <SectionLabel text="Core Financial Ratios" />
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              flexDirection: 'row',
              overflow: 'hidden',
              marginBottom: 2,
            }}
          >
            {/* left: % */}
            <PdfView
              style={{
                flex: 1,
                padding: 10,
                borderRightWidth: 1,
                borderRightColor: T.border,
                borderRightStyle: 'solid',
              }}
            >
              <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>ค่าคอมมิชชั่น</PdfText>
              <PdfText style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                {ratios.feeRate.toFixed(2)}%
              </PdfText>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginTop: 3 }}>
                สัดส่วนคอมจากยอดขายทรัพย์สินจากราคาขาย
              </PdfText>
            </PdfView>
            {/* right: amount — large number, subtitle below */}
            <PdfView style={{ flex: 1, padding: 10 }}>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>ค่าคอมมิชชั่น</PdfText>
              <PdfText style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                ฿ {formatCurrency(ratios.feeAmount)}
              </PdfText>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginTop: 3 }}>
                ค่าคอมมิชชั่นสุทธิ ({ratios.feeRate.toFixed(2)}%)
              </PdfText>
            </PdfView>
          </PdfView>

          {/* 2.4 Payment details */}
          <SectionLabel text="รายละเอียดการจ่ายเงิน" />
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 2,
            }}
          >
            {/* Bullet 1 */}
            <PdfView style={{ paddingHorizontal: 10, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: T.border, borderBottomStyle: 'solid' }}>
              <PdfText style={{ fontSize: 7.5, color: T.label, lineHeight: 1.35 }}>
                • วงกฎหมาย-ค่าธรรมเนียมกรม: สามารถจัดรับมวลงานดังกล่าวเจ้าหน้าที่นายทะเบียนการจัดสรร (36. ไ. 6.)
              </PdfText>
            </PdfView>
            {/* Bullet 2 + ID line */}
            <PdfView style={{ paddingHorizontal: 10, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: T.border, borderBottomStyle: 'solid' }}>
              <PdfText style={{ fontSize: 7.5, color: T.label, lineHeight: 1.35 }}>
                • โอนกรรมสิทธิ์: ค่านายหน้าสาระเป็นอัตราอยู่ในอัตราวลีอินทรรมนายหน้า
              </PdfText>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginTop: 2 }}>
                รหัสบัตรประชาชน: {loan.customerTaxId || '-'}
              </PdfText>
            </PdfView>
            {/* Fee line */}
            <PdfView
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderBottomWidth: 1,
                borderBottomColor: T.border,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ fontSize: 7.5, color: T.label }}>ค่าคอมมิชชั่น (กล้องสัญญากู้อนุมัติสมบูรณ์)</PdfText>
              <PdfText style={{ fontSize: 7.5, fontWeight: 700, color: T.text }}>
                ฿{formatCurrency(ratios.feeAmount)}
              </PdfText>
            </PdfView>
            {/* ยอดคงเหลือ */}
            <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 5 }}>
              <PdfText style={{ fontSize: 7.5, fontWeight: 700, color: T.text, borderBottomWidth: 1, borderBottomColor: T.text, borderBottomStyle: 'solid' }}>
                ยอดคงเหลือ:
              </PdfText>
              <PdfText style={{ fontSize: 7.5, fontWeight: 700, color: T.text, borderBottomWidth: 1, borderBottomColor: T.text, borderBottomStyle: 'solid' }}>
                ฿{formatCurrency(0)}
              </PdfText>
            </PdfView>
          </PdfView>

          {/* 2.5 Charts — real derived data */}
          <PdfView style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
            {/* Chart 1: ค่าคอมสะสม */}
            <PdfView
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: T.border,
                borderStyle: 'solid',
                borderRadius: 4,
                padding: 8,
                backgroundColor: T.bg,
              }}
            >
              <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 2 }}>
                ค่าคอมมิชชั่นสะสม
              </PdfText>
              <PdfText style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                ฿{formatCurrency(ratios.feeAmount)}{' '}
                <PdfText style={{ fontSize: 9, fontWeight: 400 }}>
                  ({ratios.feeRate.toFixed(2)}%)
                </PdfText>
              </PdfText>
              <Svg width={128} height={36}>
                <Polyline
                  points={miniChartPoints(chart1, 128, 36)}
                  stroke={T.primary}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </Svg>
            </PdfView>
            {/* Chart 2: ยอดสินเชื่อคงเหลือ */}
            <PdfView
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: T.border,
                borderStyle: 'solid',
                borderRadius: 4,
                padding: 8,
                backgroundColor: T.bg,
              }}
            >
              <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 2 }}>
                ยอดสินเชื่อคงเหลือ
              </PdfText>
              <PdfText style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 5 }}>
                ฿{formatCurrency(remainingBalance > 0 ? remainingBalance : principal)}
              </PdfText>
              <Svg width={128} height={36}>
                <Polyline
                  points={miniChartPoints(chart2, 128, 36)}
                  stroke={T.skyBlue}
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </Svg>
            </PdfView>
          </PdfView>
        </PdfView>

        {/* ── RIGHT 42% ── */}
        <PdfView style={{ width: '42%' }}>
          {/* 3.1 Main image */}
          <PdfView
            style={{
              height: 158,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              overflow: 'hidden',
              marginBottom: 6,
              backgroundColor: T.bgStripe,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {mainImageUrl ? (
              <PdfImage src={mainImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <PdfText style={{ fontSize: 8, color: T.label }}>ไม่มีรูปภาพ</PdfText>
            )}
          </PdfView>

          {/* 3 thumbnails only */}
          <PdfView style={{ flexDirection: 'row', gap: 5, marginBottom: 10 }}>
            {[0, 1, 2].map((i) => {
              const url = thumbImages[i] ?? null;
              return (
                <PdfView
                  key={i}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 3,
                    borderWidth: 1,
                    borderColor: i === 0 && url ? T.text : T.border,
                    borderStyle: 'solid',
                    overflow: 'hidden',
                    backgroundColor: T.bgStripe,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {url ? (
                    <PdfImage src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <PdfText style={{ fontSize: 7, color: T.label }}>{i + 1}</PdfText>
                  )}
                </PdfView>
              );
            })}
          </PdfView>

          {/* 3.2 Property details — NO border wrapper, plain rows */}
          <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.text, marginBottom: 6 }}>
            รายละเอียดทรัพย์สิน
          </PdfText>
          <PdfView>
            {propRows.map(([label, value], i) => (
              <PropRow key={label + i} label={label} value={value} stripe={i % 2 === 1} />
            ))}
          </PdfView>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
