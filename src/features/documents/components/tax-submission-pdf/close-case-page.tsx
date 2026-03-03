import {
  Image as PdfImage,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import { formatCurrency, formatDateOrDash, TaxFeeLoanItem } from './shared';

// ── design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: '#0a0d14',
  surface: '#111827',
  card: '#0f1420',
  border: '#1e2435',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  primary: '#60a5fa',
  success: '#34d399',
  warning: '#fbbf24',
  purple: '#3b0764', purpleBorder: '#7c3aed',
  green: '#022c22', greenBorder: '#059669',
  blue: '#172554', blueBorder: '#3b82f6',
  amber: '#451a03', amberBorder: '#d97706',
  indigo: '#1e1b4b', indigoBorder: '#6366f1',
  gray: '#1f2937', grayBorder: '#4b5563',
};

// ── helpers ────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        borderBottomStyle: 'solid',
      }}
    >
      <PdfText style={{ width: '42%', fontSize: 9, color: C.textMuted }}>
        {label}
      </PdfText>
      <PdfText style={{ flex: 1, fontSize: 9, color: C.text, fontWeight: 700 }}>
        {value}
      </PdfText>
    </PdfView>
  );
}

function Badge({
  text,
  color,
  bg,
}: {
  text: string;
  color: string;
  bg: string;
}) {
  return (
    <PdfView
      style={{
        backgroundColor: bg,
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
        alignSelf: 'flex-start',
      }}
    >
      <PdfText style={{ fontSize: 8.5, color, fontWeight: 700 }}>
        {text}
      </PdfText>
    </PdfView>
  );
}

function RatioCard({
  title,
  value,
  subtitle,
  bg,
  border,
}: {
  title: string;
  value: string;
  subtitle: string;
  bg: string;
  border: string;
}) {
  return (
    <PdfView
      style={{
        width: '32%',
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderStyle: 'solid',
        borderRadius: 6,
        padding: 7,
        marginBottom: 5,
      }}
    >
      <PdfText style={{ fontSize: 7.5, color: border, fontWeight: 700, marginBottom: 3 }}>
        {title}
      </PdfText>
      <PdfText style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>
        {value}
      </PdfText>
      <PdfText style={{ fontSize: 7, color: C.textDim, lineHeight: 1.3 }}>
        {subtitle}
      </PdfText>
    </PdfView>
  );
}

function BulletPoint({ highlight, text }: { highlight: string; text: string }) {
  return (
    <PdfView style={{ flexDirection: 'row', marginBottom: 4 }}>
      <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginRight: 4 }}>•</PdfText>
      <PdfText style={{ flex: 1, fontSize: 7.5, color: C.textMuted, lineHeight: 1.35 }}>
        <PdfText style={{ fontWeight: 700, color: C.text }}>{highlight}</PdfText>
        {' '}{text}
      </PdfText>
    </PdfView>
  );
}

// ── Simulated mini line-chart using bars ──────────────────────────────────
function MiniChart({
  values,
  color,
}: {
  values: number[];
  color: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 50,
        width: '100%',
        marginTop: 4,
      }}
    >
      {values.map((v, i) => (
        <PdfView
          key={i}
          style={{
            flex: 1,
            marginHorizontal: 1,
            height: Math.round((v / max) * 50),
            backgroundColor: color,
            opacity: 0.5 + (i / values.length) * 0.5,
            borderRadius: 1,
          }}
        />
      ))}
    </PdfView>
  );
}

// ── compute ratios ────────────────────────────────────────────────────────
function computeRatios(loan: TaxFeeLoanItem) {
  const principal = Number(loan.loanPrincipal || 0);
  const interestRate = Number(loan.interestRate || 0);
  const totalPropValue = Number(loan.totalPropertyValue || loan.propertyValue || 0);
  const currentInst = Number(loan.currentInstallment || 0);
  const totalInst = Number(loan.totalInstallments || 0);

  const roi = principal > 0 && currentInst > 0
    ? (interestRate / 12) * currentInst
    : interestRate;
  const ltv = totalPropValue > 0 ? (principal / totalPropValue) * 100 : null;
  const pToLoan = totalPropValue > 0 && principal > 0 ? totalPropValue / principal : 0;
  const ytdRealized = roi;
  const ytdPlanned = interestRate;
  const ytdGap = Math.abs(ytdRealized - ytdPlanned);
  const ytdDir = ytdRealized >= ytdPlanned ? 'lead' : 'lag';
  const nim = interestRate;
  const remainingMonths = totalInst > 0
    ? Math.max(0, totalInst - currentInst)
    : Number(loan.termMonths || 0);

  return { roi, ltv, pToLoan, ytdRealized, ytdPlanned, ytdGap, ytdDir, nim, remainingMonths };
}

// ── main component ────────────────────────────────────────────────────────
export function CloseCasePage({
  loan,
  fontFamily,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
}) {
  const primaryDeed =
    loan.titleDeeds?.find((d) => d.isPrimary) || loan.titleDeeds?.[0];
  const titleDeeds = loan.titleDeeds || [];
  const isMultipleDeed = titleDeeds.length > 1;

  // place display (product-list style)
  const normalizedAllPlaceNames = (loan.allPlaceNames || [])
    .map((n) => String(n || '').trim().replace(/\s+/g, ' '))
    .filter((n) => n && n !== '-');
  const placeNameFromLoan = String(loan.placeName || '').trim();
  const fallbackPlace =
    placeNameFromLoan ||
    normalizedAllPlaceNames[0] ||
    [primaryDeed?.amphurName, primaryDeed?.provinceName].filter(Boolean).join(' ').trim();
  const placeDisplay = isMultipleDeed
    ? `โฉนดชุด (${normalizedAllPlaceNames.join(', ') || fallbackPlace || '-'})`
    : fallbackPlace || '-';
  const primaryPlaceText =
    primaryDeed
      ? `${primaryDeed.amphurName || ''} ${primaryDeed.provinceName || ''}`.trim() || '-'
      : '-';
  const placeWithArea =
    primaryDeed?.landAreaText
      ? `${primaryPlaceText} (${primaryDeed.landAreaText})`
      : primaryPlaceText;

  // status
  const statusText =
    loan.loanStatus === 'ACTIVE' ? 'ยังไม่ถึงกำหนด'
    : loan.loanStatus === 'COMPLETED' ? 'ปิดบัญชี'
    : loan.loanStatus === 'DEFAULTED' ? 'เกินกำหนดชำระ'
    : 'รออนุมัติ';
  const statusColor =
    loan.loanStatus === 'ACTIVE' ? C.success
    : loan.loanStatus === 'COMPLETED' ? C.primary
    : loan.loanStatus === 'DEFAULTED' ? '#f87171'
    : C.warning;
  const statusBg =
    loan.loanStatus === 'COMPLETED' ? '#1e3a5f'
    : loan.loanStatus === 'ACTIVE' ? '#1a3d2a'
    : '#3b1a00';

  const currentInst = Number(loan.currentInstallment || 0);
  const totalInst = Number(loan.totalInstallments || 0);
  const installmentText = totalInst > 0 ? `${currentInst}/${totalInst}` : '-';
  const termMonths = Number(loan.termMonths || 0);
  const durationText =
    termMonths > 0
      ? `${(termMonths / 12).toFixed(termMonths % 12 === 0 ? 0 : 1)} ปี (${termMonths} งวด)`
      : '-';
  const totalPropValue = Number(loan.totalPropertyValue || loan.propertyValue || 0);
  const requestedAmount = Number(loan.requestedAmount || 0);
  const approvedAmount = Number(loan.approvedAmount || 0);
  const maxApprovedAmount = Number(loan.maxApprovedAmount || 0);

  const ratios = computeRatios(loan);

  // images — use real URLs when available
  const mainImageUrl = loan.primaryImageUrl || (loan.titleDeeds?.find((d) => d.isPrimary || true)?.imageUrl) || null;
  const thumbImages: (string | null)[] = [
    mainImageUrl,
    ...(loan.supportingImages?.slice(0, 4) ?? [null, null, null, null]),
  ].slice(0, 5);

  // mock chart data (simulated, similar to original In-development charts)
  const chartData1 = [30, 38, 35, 42, 40, 45, 55];
  const chartData2 = [28, 50, 36, 42, 38, 45, 50];

  const tabs = [
    'รายละเอียดสินเชื่อ',
    'ชำระสินเชื่อ',
    'ประเมินมูลค่าทรัพย์สิน',
    'หนังสือสัญญากู้เงิน',
    'ตารางผ่อนชำระ',
    'ยกเลิกสินเชื่อ',
  ];

  return (
    <PdfPage
      key={`c-${loan.id}`}
      size="A4"
      style={{ fontFamily, backgroundColor: C.bg, color: C.text, padding: 0 }}
    >
      <PdfView
        style={{
          margin: 8,
          borderWidth: 1,
          borderColor: C.border,
          borderStyle: 'solid',
          borderRadius: 8,
          backgroundColor: C.card,
          overflow: 'hidden',
          flex: 1,
        }}
      >
        {/* ── Sheet header ── */}
        <PdfView
          style={{
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            borderBottomStyle: 'solid',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <PdfText style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>
            รายละเอียดและวิเคราะห์สินเชื่อ
          </PdfText>
        </PdfView>

        {/* ── customer row ── */}
        <PdfView
          style={{
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            borderBottomStyle: 'solid',
            paddingHorizontal: 14,
            paddingVertical: 9,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <PdfView>
            <PdfView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
              <PdfText style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                {loan.customerName || '-'}
              </PdfText>
              <PdfView style={{ marginLeft: 8 }}>
                <Badge text={statusText} color={statusColor} bg={statusBg} />
              </PdfView>
            </PdfView>
            <PdfView style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <PdfText style={{ fontSize: 8, color: C.textMuted, marginRight: 12 }}>
                เลขที่สินเชื่อ{' '}
                <PdfText style={{ color: C.text, fontWeight: 700 }}>
                  {loan.loanNumber || '-'}
                </PdfText>
              </PdfText>
              <PdfText style={{ fontSize: 8, color: C.textMuted, marginRight: 12 }}>
                วันที่ออกสินเชื่อ{' '}
                <PdfText style={{ color: C.text }}>
                  {formatDateOrDash(loan.contractDate)}
                </PdfText>
              </PdfText>
              <PdfText style={{ fontSize: 8, color: C.textMuted }}>
                อัปเดตล่าสุด{' '}
                <PdfText style={{ color: C.text }}>
                  {formatDateOrDash(loan.date)}
                </PdfText>
              </PdfText>
            </PdfView>
          </PdfView>
        </PdfView>

        {/* ── tab bar ── */}
        <PdfView
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            borderBottomStyle: 'solid',
            paddingHorizontal: 14,
          }}
        >
          {tabs.map((tab, i) => (
            <PdfView
              key={tab}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 1,
                marginRight: 14,
                borderBottomWidth: i === 0 ? 2 : 0,
                borderBottomColor: C.primary,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText
                style={{
                  fontSize: 8,
                  color: i === 0 ? C.primary : C.textDim,
                  fontWeight: i === 0 ? 700 : 400,
                }}
              >
                {tab}
              </PdfText>
            </PdfView>
          ))}
        </PdfView>

        {/* ── main 58/42 layout ── */}
        <PdfView
          style={{
            flexDirection: 'row',
            flex: 1,
            paddingHorizontal: 12,
            paddingTop: 8,
          }}
        >
          {/* ── LEFT 58% ── */}
          <PdfView style={{ width: '58%', paddingRight: 10 }}>

            {/* สรุปสินเชื่อ */}
            <PdfView
              style={{
                borderWidth: 1,
                borderColor: C.border,
                borderStyle: 'solid',
                borderRadius: 6,
                backgroundColor: C.surface,
                marginBottom: 8,
                overflow: 'hidden',
              }}
            >
              <PdfView
                style={{
                  backgroundColor: '#162032',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                  borderBottomStyle: 'solid',
                }}
              >
                <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: C.text }}>
                  สรุปสินเชื่อ
                </PdfText>
              </PdfView>
              <PdfView style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8 }}>
                {/* สถานะ */}
                <PdfView style={{ flex: 1 }}>
                  <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginBottom: 4 }}>สถานะ</PdfText>
                  <Badge text={statusText} color={statusColor} bg={statusBg} />
                </PdfView>
                {/* วงเงิน */}
                <PdfView style={{ flex: 1 }}>
                  <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginBottom: 4 }}>วงเงิน</PdfText>
                  <PdfText style={{ fontSize: 10, fontWeight: 700, color: C.text }}>
                    ฿{Number(loan.loanPrincipal || 0).toLocaleString('th-TH')}
                  </PdfText>
                </PdfView>
                {/* ดอกเบี้ย */}
                <PdfView style={{ flex: 1 }}>
                  <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginBottom: 4 }}>ดอกเบี้ย</PdfText>
                  <PdfText style={{ fontSize: 10, fontWeight: 700, color: C.text }}>
                    {Number(loan.interestRate || 0).toFixed(2)}%
                  </PdfText>
                </PdfView>
                {/* งวดที่ชำระ */}
                <PdfView style={{ flex: 1 }}>
                  <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginBottom: 4 }}>งวดที่ชำระ</PdfText>
                  <Badge text={installmentText} color="#93c5fd" bg="#1e3a5f" />
                </PdfView>
              </PdfView>
            </PdfView>

            {/* Core Financial Ratios */}
            <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: C.text, marginBottom: 5 }}>
              📊 Core Financial Ratios
            </PdfText>
            <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <RatioCard title="ROI" value={`${ratios.roi.toFixed(2)}%`}
                subtitle={`ลูกหนี้ทำกำไร ${ratios.roi.toFixed(2)}% ของเงินต้น`}
                bg={C.purple} border={C.purpleBorder} />
              <RatioCard title="LTV"
                value={ratios.ltv !== null ? `${ratios.ltv.toFixed(1)}%` : '-'}
                subtitle={ratios.ltv !== null
                  ? ratios.ltv < 80 ? 'อัตราส่วนสูง มีความเสี่ยงปานกลาง' : 'อัตราส่วนสูง มีความเสี่ยง'
                  : '💡ประเมินมูลค่าทรัพย์สินก่อน'}
                bg={C.green} border={C.greenBorder} />
              <RatioCard title="P/Loan"
                value={ratios.pToLoan > 0 ? `${ratios.pToLoan.toFixed(2)}x (Test)` : '-'}
                subtitle={`มูลค่าทรัพย์สินกว่าเงินกู้ ${ratios.pToLoan.toFixed(2)} เท่า`}
                bg={C.blue} border={C.blueBorder} />
            </PdfView>
            <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <RatioCard title="YTD (Realized)" value={`${ratios.ytdRealized.toFixed(1)}%`}
                subtitle="ผลตอบแทนจริง ณ ปัจจุบันสูงกว่าดอกเบี้ยที่เสนอ"
                bg={C.purple} border={C.purpleBorder} />
              <RatioCard title="YTD (Planned)" value={`${ratios.ytdPlanned.toFixed(1)}%`}
                subtitle="ผลตอบแทนคาดการณ์ตามแผน ดำเนินไปได้ดี"
                bg={C.blue} border={C.blueBorder} />
              <RatioCard title="Δ YTD Gap"
                value={`${ratios.ytdGap.toFixed(1)}% ${ratios.ytdDir}`}
                subtitle={`ส่วนต่างระหว่างจริงและแผน (${ratios.ytdDir === 'lag' ? 'ต่ำกว่า' : 'สูงกว่า'} ${ratios.ytdGap.toFixed(1)}%)`}
                bg={C.amber} border={C.amberBorder} />
            </PdfView>
            <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <RatioCard title="NIM (Net Interest Margin)" value={`${ratios.nim.toFixed(1)}%`}
                subtitle="มาร์จิ้นดอกเบี้ยสุทธิเทียบกับเงินต้น"
                bg={C.purple} border={C.purpleBorder} />
              <RatioCard title="IRR (Internal Rate of Return)" value="ยังไม่มีข้อมูล"
                subtitle="อัตราผลตอบแทนแท้จริงรวมเวลา"
                bg={C.indigo} border={C.indigoBorder} />
              <RatioCard title="Duration (Tenor Remaining)"
                value={ratios.remainingMonths > 0
                  ? ratios.remainingMonths < 12
                    ? `${ratios.remainingMonths} เดือน`
                    : `${(ratios.remainingMonths / 12).toFixed(1)} ปี`
                  : 'ยังไม่มีข้อมูล'}
                subtitle="ระยะเวลาคงเหลือ ใช้ในการวัด risk exposure"
                bg={C.gray} border={C.grayBorder} />
            </PdfView>

            {/* กราฟการวิเคราะห์ (In development) */}
            <PdfView
              style={{
                borderWidth: 1,
                borderColor: C.border,
                borderStyle: 'solid',
                borderRadius: 6,
                backgroundColor: C.surface,
                marginTop: 3,
                overflow: 'hidden',
              }}
            >
              <PdfView
                style={{
                  backgroundColor: '#162032',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                  borderBottomStyle: 'solid',
                }}
              >
                <PdfText style={{ fontSize: 8, fontWeight: 700, color: C.text }}>
                  กราฟการวิเคราะห์ (In development)
                </PdfText>
              </PdfView>
              <PdfView style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8 }}>
                <PdfView style={{ flex: 1, marginRight: 8 }}>
                  <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginBottom: 2 }}>Demo...</PdfText>
                  <PdfText style={{ fontSize: 12, fontWeight: 700, color: C.text }}>$0,000,000.00</PdfText>
                  <MiniChart values={chartData1} color="#4921EA" />
                </PdfView>
                <PdfView style={{ flex: 1 }}>
                  <PdfText style={{ fontSize: 7.5, color: C.textMuted, marginBottom: 2 }}>Demo..</PdfText>
                  <PdfText style={{ fontSize: 12, fontWeight: 700, color: C.text }}>0,000.00</PdfText>
                  <MiniChart values={chartData2} color="#4921EA" />
                </PdfView>
              </PdfView>
            </PdfView>

            {/* วิเคราะห์การลงทุน */}
            <PdfView
              style={{
                backgroundColor: '#111827',
                borderRadius: 4,
                padding: 7,
                marginTop: 5,
              }}
            >
              <PdfText style={{ fontSize: 8, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                💡 วิเคราะห์การลงทุน
              </PdfText>
              <BulletPoint
                highlight={`ลูกค้าคำนวณถึง ROI สะสมสูง (${ratios.roi.toFixed(2)}%)`}
                text={`จากการจัดเก็บดอกเบี้ยของเงินต้น ${currentInst} เดือน`}
              />
              {ratios.ltv !== null ? (
                <BulletPoint
                  highlight={`LTV ต่ำ (${ratios.ltv.toFixed(0)}%)`}
                  text="ของมูลค่าหลักทรัพย์ ค่อนข้างปลอดภัย"
                />
              ) : (
                <BulletPoint
                  highlight="ยังไม่มีข้อมูล LTV"
                  text="ต้องประเมินมูลค่าทรัพย์สินก่อน"
                />
              )}
              <BulletPoint
                highlight={`YTD Real ${ratios.ytdRealized.toFixed(1)}%`}
                text="แปลว่าดอกเบี้ยจริง ณ ปัจจุบันนี้ ยังคงอยู่ในระดับดอกเบี้ยเสนอ"
              />
              <BulletPoint
                highlight={`P/Loan ${ratios.pToLoan.toFixed(2)}`}
                text={`แปลว่าพรีเมียมราคาบนทรัพย์สิน ${ratios.pToLoan.toFixed(2)} เท่า แสดงถึงศักยภาพที่ดี`}
              />
              <BulletPoint
                highlight="การตั้งงวดดอก Duration = ∞ (ไม่มีกำหนด)"
                text="หมายความว่าไม่มีผลิตภัณฑ์สะสมระยะสั้น เนื่องจากเลือกการผ่อนชำระระยะยาว"
              />
            </PdfView>
          </PdfView>

          {/* ── RIGHT 42% ── */}
          <PdfView style={{ width: '42%' }}>
            {/* main image */}
            <PdfView
              style={{
                height: 175,
                borderRadius: 6,
                backgroundColor: C.surface,
                borderWidth: 1,
                borderColor: C.border,
                borderStyle: 'solid',
                overflow: 'hidden',
                marginBottom: 6,
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
                <PdfText style={{ fontSize: 8.5, color: C.textDim }}>
                  รูปหลักประกัน / โฉนด
                </PdfText>
              )}
            </PdfView>

            {/* 5 thumbnails */}
            <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const url = thumbImages[i] ?? null;
                return (
                  <PdfView
                    key={i}
                    style={{
                      width: '18.5%',
                      height: 34,
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: i === 0 ? C.text : C.border,
                      borderStyle: 'solid',
                      backgroundColor: C.surface,
                      overflow: 'hidden',
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
                      <PdfText style={{ fontSize: 6.5, color: C.textDim }}>{i + 1}</PdfText>
                    )}
                  </PdfView>
                );
              })}
            </PdfView>

            {/* description text */}
            <PdfText style={{ fontSize: 8, color: C.textMuted, lineHeight: 1.4, marginBottom: 7 }}>
              รายละเอียด (In development): Lorem ipsum dolor sit amet consectetur
              adipisicing elit. Hic dolorum voluptatum temporibus officia.
            </PdfText>

            {/* divider */}
            <PdfView
              style={{
                borderTopWidth: 1,
                borderTopColor: C.border,
                borderTopStyle: 'solid',
                marginBottom: 7,
              }}
            />

            {/* property details */}
            <InfoRow label="ประเภทสินเชื่อ" value="จำนองบ้านและที่ดิน" />
            <InfoRow label="ระยะเวลา" value={durationText} />
            <InfoRow
              label="อัตราดอกเบี้ย"
              value={`${Number(loan.interestRate || 0).toFixed(2)}% ต่อปี`}
            />
            <InfoRow label="ความเสี่ยง" value="ความเสี่ยงปานกลาง" />

            {!isMultipleDeed ? (
              <>
                <InfoRow label="สถานที่" value={placeWithArea} />
                <InfoRow label="ประเภททรัพย์" value={primaryDeed?.landType || '-'} />
                <InfoRow
                  label="มูลค่าประเมิน"
                  value={totalPropValue > 0 ? `฿${totalPropValue.toLocaleString('th-TH')}` : '-'}
                />
                <InfoRow
                  label="โฉนด"
                  value={loan.titleDeedNumber || primaryDeed?.deedNumber || '-'}
                />
                <InfoRow
                  label="เจ้าของ"
                  value={primaryDeed?.ownerName || loan.ownerName || '-'}
                />
              </>
            ) : (
              <>
                <InfoRow
                  label="มูลค่าประเมินรวม"
                  value={totalPropValue > 0 ? `฿${totalPropValue.toLocaleString('th-TH')}` : '-'}
                />
                <InfoRow
                  label="โฉนดที่ดิน"
                  value={`${titleDeeds.length} โฉนด — ${placeDisplay}`}
                />
              </>
            )}

            {requestedAmount > 0 && (
              <InfoRow
                label="วงเงินที่ขอ"
                value={`฿${requestedAmount.toLocaleString('th-TH')}`}
              />
            )}
            {approvedAmount > 0 && (
              <InfoRow
                label="วงเงินอนุมัติ"
                value={`฿${approvedAmount.toLocaleString('th-TH')}`}
              />
            )}
            {maxApprovedAmount > 0 && (
              <InfoRow
                label="วงเงินสูงสุด"
                value={`฿${maxApprovedAmount.toLocaleString('th-TH')}`}
              />
            )}
          </PdfView>
        </PdfView>

        {/* ── footer ── */}
        <PdfView
          style={{
            borderTopWidth: 1,
            borderTopColor: C.border,
            borderTopStyle: 'solid',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 5,
          }}
        >
          <PdfText style={{ fontSize: 7.5, color: C.textDim }}>
            ชุดเอกสารนำส่งภาษี — {loan.loanNumber || '-'}
          </PdfText>
          <PdfText style={{ fontSize: 7.5, color: C.textDim }}>
            ออกเมื่อ {formatDateOrDash(loan.date)}
          </PdfText>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
