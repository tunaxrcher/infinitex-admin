import {
  Image as PdfImage,
  Page as PdfPage,
  Path,
  Polyline,
  Svg,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import { formatCurrency, formatDateOrDash, TaxFeeLoanItem } from './shared';

// ── design tokens ─────────────────────────────────────────────────────────
const T = {
  text: '#111827',
  label: '#6b7280',
  border: '#e5e7eb',
  borderMid: '#d1d5db',
  bg: '#ffffff',
  bgStripe: '#f9fafb',
  bgTag: '#f3f4f6',
  blue: '#2563eb',
  green: '#16a34a',
  red: '#dc2626',
  primary: '#4f46e5',
};

// ── helpers ───────────────────────────────────────────────────────────────
function miniChartPoints(values: number[], w = 126, h = 36): string {
  const max = Math.max(...values, 1);
  const step = w / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`)
    .join(' ');
}

function computeRatios(loan: TaxFeeLoanItem) {
  const principal = Number(loan.loanPrincipal || 0);
  const interestRate = Number(loan.interestRate || 0);
  const totalPropValue = Number(loan.totalPropertyValue || loan.propertyValue || 0);
  const currentInst = Number(loan.currentInstallment || 0);

  const nim = interestRate;
  const ltv = totalPropValue > 0 ? (principal / totalPropValue) * 100 : null;
  const pToLoan = totalPropValue > 0 && principal > 0 ? totalPropValue / principal : 0;
  const feeRate = Number(loan.taxRate || 0);
  const feeAmount = Number(loan.feeAmount || 0);
  const ytdRealized = principal > 0 && currentInst > 0 ? (interestRate / 12) * currentInst : interestRate;
  const remainingValue = totalPropValue - principal;

  return { nim, ltv, pToLoan, feeRate, feeAmount, ytdRealized, remainingValue, totalPropValue };
}

// ── sub-components ────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <PdfView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <PdfView
        style={{
          width: 4,
          height: 12,
          backgroundColor: T.text,
          marginRight: 5,
          borderRadius: 1,
        }}
      />
      <PdfText style={{ fontSize: 9, fontWeight: 700, color: T.text }}>
        {text}
      </PdfText>
    </PdfView>
  );
}

function RatioCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
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
      <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>{title}</PdfText>
      <PdfText style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 2 }}>
        {value}
      </PdfText>
      <PdfText style={{ fontSize: 7, color: T.label, lineHeight: 1.3 }}>{subtitle}</PdfText>
    </PdfView>
  );
}

function TableRow({ label, value, stripe }: { label: string; value: string; stripe?: boolean }) {
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        backgroundColor: stripe ? T.bgStripe : T.bg,
        paddingHorizontal: 8,
        paddingVertical: 4.5,
      }}
    >
      <PdfText style={{ width: '45%', fontSize: 8, color: T.label }}>{label}</PdfText>
      <PdfText style={{ flex: 1, fontSize: 8, color: T.text, fontWeight: 700 }}>{value}</PdfText>
    </PdfView>
  );
}

function MiniLineChart({
  values,
  color = T.primary,
  label,
  sublabel,
}: {
  values: number[];
  color?: string;
  label: string;
  sublabel: string;
}) {
  const W = 130;
  const H = 38;
  const points = miniChartPoints(values, W, H);

  return (
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
      <PdfText style={{ fontSize: 8.5, color: T.label, marginBottom: 2 }}>Demo.</PdfText>
      <PdfText style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 1 }}>
        {label}
      </PdfText>
      <PdfText style={{ fontSize: 7, color: T.label, marginBottom: 5 }}>{sublabel}</PdfText>
      <Svg width={W} height={H}>
        <Polyline
          points={points}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </PdfView>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export function CloseCasePage({
  loan,
  fontFamily,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
}) {
  const primaryDeed = loan.titleDeeds?.find((d) => d.isPrimary) || loan.titleDeeds?.[0];

  // place
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
  const placeWithArea =
    primaryDeed?.landAreaText
      ? `${fallbackPlace} (${primaryDeed.landAreaText})`
      : fallbackPlace || '-';

  const statusText =
    loan.loanStatus === 'ACTIVE' ? 'ยังไม่ถึงกำหนด'
    : loan.loanStatus === 'COMPLETED' ? 'ปิดการขาย'
    : loan.loanStatus === 'DEFAULTED' ? 'เกินกำหนดชำระ'
    : 'รออนุมัติ';

  const termMonths = Number(loan.termMonths || 0);
  const durationText = termMonths > 0
    ? `${(termMonths / 12).toFixed(termMonths % 12 === 0 ? 0 : 1)} ปี (${termMonths} งวด)`
    : '-';
  const totalPropValue = Number(loan.totalPropertyValue || loan.propertyValue || 0);
  const approvedAmount = Number(loan.approvedAmount || 0);

  const ratios = computeRatios(loan);

  // images
  const mainImageUrl = loan.primaryImageUrl || loan.titleDeeds?.[0]?.imageUrl || null;
  const extraImages = [
    ...(loan.supportingImages || []),
    ...((loan.titleDeeds || []).slice(1).map((d) => d.imageUrl).filter(Boolean) as string[]),
  ].slice(0, 4);

  // chart data
  const chartData1 = [30, 42, 38, 55, 48, 60, 65, 72, 68, 75];
  const chartData2 = [28, 35, 30, 42, 45, 40, 52, 48, 55, 58];

  // payment details
  const feeAmount = ratios.feeAmount;
  const halfFee = feeAmount / 2;

  // property details rows
  const propertyRows: Array<[string, string]> = [
    ['รหัสทรัพย์', loan.titleDeedNumber || primaryDeed?.deedNumber || loan.loanNumber || '-'],
    ['ที่ตั้ง', placeWithArea],
    ['ประเภท', primaryDeed?.landType || loan.propertyType || '-'],
    ['ค่าคอมมิชชัน', `${ratios.feeRate.toFixed(2)}%`],
    ['อัตราเงินกู้', ratios.ltv !== null ? `${ratios.ltv.toFixed(2)}%` : '-'],
    ['ค่าคอมสุทธิ', `฿${formatCurrency(feeAmount)}`],
    ['IRR', '-'],
    ['IRR:', `${ratios.ytdRealized.toFixed(2)}% Lead`],
    ['ราคาประเมิน', totalPropValue > 0 ? `฿${formatCurrency(totalPropValue)}` : '-'],
    ['ราคาขาย', `฿${formatCurrency(loan.loanPrincipal || 0)}`],
    ['วงเงินกู้ยืม', approvedAmount > 0 ? `฿${formatCurrency(approvedAmount)}` : '-'],
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
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <PdfText
        style={{
          fontSize: 26,
          fontWeight: 700,
          textAlign: 'center',
          color: T.text,
          marginBottom: 14,
        }}
      >
        ใบปิดเคสค่านายหน้า
      </PdfText>
      <PdfView
        style={{
          borderTopWidth: 1,
          borderTopColor: T.borderMid,
          borderTopStyle: 'solid',
          marginBottom: 10,
        }}
      />

      <PdfView
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}
      >
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
            REF-{(loan.loanNumber || 'N/A').replace(/[^0-9A-Za-z]/g, '').slice(-6)}
          </PdfText>
        </PdfView>
      </PdfView>

      <PdfText style={{ fontSize: 8, color: T.label, marginBottom: 12 }}>
        เลขประจำตัวผู้เสียภาษี : {loan.customerTaxId || '-'}
        {'   '}วันที่รายงานผล: วันที่ : {formatDateOrDash(loan.date)}
        {'   '}วันที่สิ้นสุดสัญญา: {formatDateOrDash(loan.expiryDate)}
      </PdfText>

      {/* ── 2. MAIN CONTENT (60 / 40) ────────────────────────────────────── */}
      <PdfView style={{ flexDirection: 'row', gap: 14, flex: 1 }}>
        {/* ── LEFT 60% ── */}
        <PdfView style={{ width: '58%' }}>

          {/* 2.1 สรุปผล */}
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              padding: 10,
              marginBottom: 10,
              backgroundColor: T.bg,
            }}
          >
            <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.text, marginBottom: 8 }}>
              สรุปผล
            </PdfText>
            <PdfView style={{ flexDirection: 'row' }}>
              <PdfView style={{ flex: 1 }}>
                <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>ราคาขาย</PdfText>
                <PdfText style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  ฿{Number(loan.loanPrincipal || 0).toLocaleString('th-TH')}
                </PdfText>
              </PdfView>
              <PdfView style={{ flex: 1 }}>
                <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>วงเงิน</PdfText>
                <PdfText style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  ฿{formatCurrency(feeAmount)}{' '}
                  <PdfText style={{ fontSize: 10, fontWeight: 400 }}>
                    ({ratios.feeRate.toFixed(0)}%)
                  </PdfText>
                </PdfText>
              </PdfView>
              <PdfView style={{ flex: 1 }}>
                <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>สถานะ</PdfText>
                <PdfText style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                  {statusText}
                </PdfText>
              </PdfView>
            </PdfView>
          </PdfView>

          {/* 2.2 Core Financial Ratios */}
          <SectionLabel text="Core Financial Ratios" />
          <PdfView style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
            <RatioCard
              title="NIM"
              value={`${ratios.nim.toFixed(2)}%`}
              subtitle="สัดส่วนมาร์จิ้นดอกเบี้ยสุทธิเทียบกับราคาขาย"
            />
            <RatioCard
              title="LTV"
              value={ratios.ltv !== null ? `${ratios.ltv.toFixed(1)}%` : '-'}
              subtitle="สัดส่วนเงินกู้เทียบกับราคาประเมิน"
            />
            <RatioCard
              title="PT Loan"
              value={ratios.pToLoan > 0 ? `${ratios.pToLoan.toFixed(2)}x (Test)` : '-'}
              subtitle="สัดส่วนราคาทรัพย์สินเทียบกับวงเงินกู้"
            />
          </PdfView>

          {/* 2.3 ค่าคอมมิชชัน */}
          <SectionLabel text="Core Financial Ratios" />
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              flexDirection: 'row',
              overflow: 'hidden',
              marginBottom: 10,
            }}
          >
            <PdfView style={{ flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: T.border, borderRightStyle: 'solid' }}>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>ค่าคอมมิชชัน</PdfText>
              <PdfText style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                {ratios.feeRate.toFixed(2)}%
              </PdfText>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginTop: 2 }}>
                สัดส่วนคอมจากยอดขายทรัพย์สินจากราคาขาย
              </PdfText>
            </PdfView>
            <PdfView style={{ flex: 1, padding: 10 }}>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginBottom: 3 }}>ค่าคอมมิชชัน</PdfText>
              <PdfText style={{ fontSize: 18, fontWeight: 700, color: T.text }}>
                ฿ {formatCurrency(feeAmount)}
              </PdfText>
              <PdfText style={{ fontSize: 7.5, color: T.label, marginTop: 2 }}>
                ({ratios.feeRate.toFixed(2)}%)
              </PdfText>
            </PdfView>
          </PdfView>

          {/* 2.4 รายละเอียดการจ่ายเงิน */}
          <SectionLabel text="รายละเอียดการจ่ายเงิน" />
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              marginBottom: 10,
              overflow: 'hidden',
            }}
          >
            <PdfView style={{ paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: T.border, borderBottomStyle: 'solid' }}>
              <PdfText style={{ fontSize: 7.5, color: T.label }}>
                • วงกฎหมาย-ค่าธรรมเนียมกรม: สามารถจัดรับมวลงานดังกล่าวเจ้าหน้าที่นายทะเบียนการจัดสรร (36. ไ. 6.)
              </PdfText>
            </PdfView>
            <PdfView style={{ paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: T.border, borderBottomStyle: 'solid' }}>
              <PdfText style={{ fontSize: 7.5, color: T.label }}>
                • โอนกรรมสิทธิ์: ค่านายหน้าสาระเป็นอัตราอยู่ในอัตราวลีอินทรรมนายหน้า
              </PdfText>
            </PdfView>
            <PdfView style={{ paddingHorizontal: 10, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: T.border, borderBottomStyle: 'solid', backgroundColor: T.bgStripe }}>
              <PdfText style={{ fontSize: 7.5, color: T.label }}>
                รวม{(halfFee * 2 + feeAmount * 0.1).toFixed(0)}
              </PdfText>
            </PdfView>
            <PdfView
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: T.border,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ fontSize: 7.5, color: T.label }}>ค่าคอมมิชชัน (ก้อนสัญญากู้อนุมัติสมบูรณ์)</PdfText>
              <PdfText style={{ fontSize: 7.5, fontWeight: 700, color: T.text }}>
                ฿{formatCurrency(feeAmount)}
              </PdfText>
            </PdfView>
            <PdfView
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <PdfText
                style={{
                  fontSize: 7.5,
                  color: T.text,
                  fontWeight: 700,
                  borderBottomWidth: 1,
                  borderBottomColor: T.text,
                  borderBottomStyle: 'solid',
                }}
              >
                ยอดคงเหลือ:
              </PdfText>
              <PdfText
                style={{
                  fontSize: 7.5,
                  fontWeight: 700,
                  color: T.text,
                  borderBottomWidth: 1,
                  borderBottomColor: T.text,
                  borderBottomStyle: 'solid',
                }}
              >
                ฿{formatCurrency(0)}
              </PdfText>
            </PdfView>
          </PdfView>

          {/* 2.5 กราฟ */}
          <PdfView style={{ flexDirection: 'row', gap: 6 }}>
            <MiniLineChart
              values={chartData1}
              color={T.primary}
              label={`฿${(Number(loan.loanPrincipal || 0) * 0.02).toLocaleString('th-TH')} (${ratios.feeRate.toFixed(2)}%)`}
              sublabel="ค่าคอมมิชชัน"
            />
            <MiniLineChart
              values={chartData2}
              color="#0ea5e9"
              label={`฿${formatCurrency(feeAmount)}`}
              sublabel="ค่าคอมสุทธิ"
            />
          </PdfView>
        </PdfView>

        {/* ── RIGHT 40% ── */}
        <PdfView style={{ width: '42%' }}>
          {/* 3.1 รูปภาพ */}
          <PdfView
            style={{
              height: 160,
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
              <PdfImage
                src={mainImageUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <PdfText style={{ fontSize: 8, color: T.label }}>ไม่มีรูปภาพ</PdfText>
            )}
          </PdfView>

          <PdfView style={{ flexDirection: 'row', gap: 5, marginBottom: 10 }}>
            {[0, 1, 2, 3].map((i) => {
              const url = extraImages[i] ?? null;
              return (
                <PdfView
                  key={i}
                  style={{
                    flex: 1,
                    height: 42,
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
                    <PdfImage
                      src={url}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <PdfText style={{ fontSize: 7, color: T.label }}>{i + 1}</PdfText>
                  )}
                </PdfView>
              );
            })}
          </PdfView>

          {/* 3.2 รายละเอียดทรัพย์สิน */}
          <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.text, marginBottom: 5 }}>
            รายละเอียดทรัพย์สิน
          </PdfText>
          <PdfView
            style={{
              borderWidth: 1,
              borderColor: T.border,
              borderStyle: 'solid',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            {propertyRows.map(([label, value], i) => (
              <TableRow key={label} label={label} value={value} stripe={i % 2 === 1} />
            ))}
          </PdfView>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
