import {
  Circle,
  Image as PdfImage,
  Page as PdfPage,
  Svg,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  TaxFeeLoanItem,
  toThaiBahtText,
} from './shared';

// ── design tokens ──────────────────────────────────────────────────────────
const T = {
  text: '#111827',
  label: '#4b5563',
  muted: '#6b7280',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  bg: '#ffffff',
  bgGray: '#f9fafb',
  bgHeader: '#f3f4f6',
  highlight: '#eff6ff',  // ไฮไลต์ฟ้าอ่อน
  blue: '#1d4ed8',
};

// ── Fieldset / Legend style box ───────────────────────────────────────────
/**
 * จำลอง HTML <fieldset><legend> โดยใช้ marginTop: -8 บน label View
 * เพื่อให้หัวข้อ "ตัด" เส้นขอบด้านบน
 */
function FieldsetBox({
  label,
  labelWidth = 90,
  children,
  style = {},
}: {
  label: string;
  labelWidth?: number;
  children: React.ReactNode;
  style?: Record<string, unknown>;
}) {
  return (
    <PdfView
      style={{
        borderWidth: 1,
        borderColor: T.border,
        borderStyle: 'solid',
        borderRadius: 3,
        padding: 8,
        paddingTop: 10,
        backgroundColor: T.bg,
        ...(style as any),
      }}
    >
      {/* Legend label — วางทับเส้นขอบด้านบน */}
      <PdfView
        style={{
          position: 'absolute',
          top: -8,
          left: 10,
          backgroundColor: T.bg,
          paddingHorizontal: 4,
        }}
      >
        <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.text }}>
          {label}
        </PdfText>
      </PdfView>
      {children}
    </PdfView>
  );
}

// ── 2-column key-value row ─────────────────────────────────────────────────
function KVRow({
  label,
  value,
  last = false,
  highlight = false,
}: {
  label: string;
  value: string;
  last?: boolean;
  highlight?: boolean;
}) {
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        paddingVertical: 4,
        backgroundColor: highlight ? T.highlight : T.bg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: T.borderLight,
        borderBottomStyle: 'solid',
      }}
    >
      <PdfText style={{ width: '42%', fontSize: 8.5, color: T.label }}>{label}</PdfText>
      <PdfText style={{ flex: 1, fontSize: 8.5, color: T.text, fontWeight: highlight ? 700 : 400 }}>
        {value}
      </PdfText>
    </PdfView>
  );
}

// ── Photo placeholder / real image ─────────────────────────────────────────
function PhotoBox({
  src,
  label,
  style = {},
}: {
  src?: string | null;
  label?: string;
  style?: Record<string, unknown>;
}) {
  return (
    <PdfView
      style={{
        borderWidth: 1,
        borderColor: T.borderLight,
        borderStyle: 'solid',
        borderRadius: 3,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: T.bgGray,
        ...(style as any),
      }}
    >
      {src ? (
        <PdfImage src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <PdfText style={{ fontSize: 7.5, color: T.muted }}>{label || '-'}</PdfText>
      )}
    </PdfView>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export function AppraisalPage({
  loan,
  fontFamily,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
}) {
  const deed = loan.titleDeeds?.find((d) => d.isPrimary) || loan.titleDeeds?.[0];

  // ── valuation numbers ──────────────────────────────────────────────────
  const netValue    = Number(loan.estimatedValue || loan.totalPropertyValue || loan.propertyValue || 0);
  const depRate     = 0.10;                              // 10% ค่าเสื่อมราคา
  const grossValue  = netValue / (1 - depRate);          // ย้อนคำนวณ: grossValue × 90% = netValue
  const landValue   = Math.round(grossValue * 0.60);     // ที่ดิน 60%
  const buildValue  = Math.round(grossValue * 0.40);     // สิ่งปลูกสร้าง 40%
  const totalGross  = landValue + buildValue;            // รวมก่อนหัก
  const depAmount   = Math.round(totalGross * depRate);  // หัก ค่าเสื่อมราคา

  // ── area parsing ────────────────────────────────────────────────────────
  const areaText  = deed?.landAreaText || '-';
  // พยายามดึงเนื้อที่ ตร.ว. จาก landAreaText (เช่น "1 ไร่ 2 งาน 34 ตร.ว.")
  const sqWahMatch = areaText.match(/(\d+(?:\.\d+)?)\s*ตร\.ว/);
  const sqWah      = sqWahMatch ? Number(sqWahMatch[1]) : null;
  const pricePerSqWah = sqWah && landValue > 0 ? Math.round(landValue / sqWah) : null;

  // ── comparison rows ────────────────────────────────────────────────────
  const compareRows: [string, string, string, number][] = [
    ['1', 'แปลงใกล้เคียงทิศเหนือ',  sqWah ? `${sqWah} ตร.ว.` : '-', Math.round(netValue * 0.97)],
    ['2', 'แปลงใกล้เคียงทิศใต้',    sqWah ? `${sqWah} ตร.ว.` : '-', Math.round(netValue * 1.03)],
    ['3', 'แปลงเปรียบเทียบตลาด',    sqWah ? `${sqWah} ตร.ว.` : '-', Math.round(netValue * 0.95)],
  ];
  const medianValue = Math.round(netValue * 0.96);

  // ── images ─────────────────────────────────────────────────────────────
  const deedImageUrl    = deed?.imageUrl || loan.primaryImageUrl || null;
  const supportImgs     = loan.supportingImages || [];
  const largePhoto      = supportImgs[0] || null;
  const smallPhoto1     = supportImgs[1] || null;
  const smallPhoto2     = supportImgs[2] || null;

  return (
    <PdfPage
      key={`a-${loan.id}`}
      size="A4"
      style={{ fontFamily, backgroundColor: T.bg, color: T.text, paddingHorizontal: 28, paddingVertical: 22, fontSize: 9 }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <PdfText style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>
        ใบประเมินมูลค่าทรัพย์สิน
      </PdfText>

      {/* Divider with sub-title */}
      <PdfView style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <PdfView style={{ flex: 1, borderTopWidth: 1, borderTopColor: T.border, borderTopStyle: 'solid' }} />
        <PdfText style={{ paddingHorizontal: 10, fontSize: 9, color: T.muted }}>
          รายงานการประเมินราคาอสังหาริมทรัพย์
        </PdfText>
        <PdfView style={{ flex: 1, borderTopWidth: 1, borderTopColor: T.border, borderTopStyle: 'solid' }} />
      </PdfView>

      {/* Meta row */}
      <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <PdfView>
          <PdfText style={{ fontWeight: 700, fontSize: 9 }}>
            หลักทรัพย์ : {loan.loanNumber || '-'}
          </PdfText>
          <PdfText style={{ marginTop: 2, fontSize: 8.5, color: T.muted }}>
            คำรับ : วางหลักทรัพย์จำนอง
          </PdfText>
        </PdfView>
        <PdfView style={{ alignItems: 'flex-end' }}>
          <PdfText style={{ fontWeight: 700, fontSize: 9 }}>
            วันที่ประเมิน : {formatDateOrDash(loan.valuationDate || loan.date)}
          </PdfText>
          <PdfText style={{ marginTop: 2, fontSize: 8.5, color: T.muted }}>
            เลขที่รายงาน : AV-REP-{loan.loanNumber || '-'}
          </PdfText>
        </PdfView>
      </PdfView>

      {/* ── MAIN CONTENT: LEFT 58% / RIGHT 40% ──────────────────────────── */}
      <PdfView style={{ flexDirection: 'row', gap: 12 }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <PdfView style={{ width: '57%' }}>

          {/* 1. ข้อมูลทรัพย์สิน */}
          <FieldsetBox label="ข้อมูลทรัพย์สิน" style={{ marginBottom: 10 }}>
            <KVRow label="ประเภททรัพย์"    value={deed?.landType || 'ที่ดินพร้อมสิ่งปลูกสร้าง'} />
            <KVRow label="เนื้อที่"         value={areaText} />
            <KVRow label="เลขที่โฉนด"       value={loan.titleDeedNumber || deed?.deedNumber || '-'} />
            <KVRow
              label="ที่ตั้ง / ทำเล"
              value={[deed?.amphurName, deed?.provinceName].filter(Boolean).join(' ') || '-'}
            />
            <KVRow label="ผู้ถือกรรมสิทธิ์" value={deed?.ownerName || loan.ownerName || '-'} />
            <KVRow label="ภาระผูกพัน"       value="จำนองต่อสถาบันการเงิน" last />
          </FieldsetBox>

          {/* 2. ผลการประเมินมูลค่า ⭐ */}
          <FieldsetBox label="ผลการประเมินมูลค่า" style={{ marginBottom: 10 }}>
            {/* บรรทัดที่ 1-2: รายการตั้งต้น */}
            <KVRow label="มูลค่าที่ดิน"       value={`฿${formatCurrency(landValue)}`} />
            <KVRow label="มูลค่าสิ่งปลูกสร้าง" value={`฿${formatCurrency(buildValue)}`} />

            {/* บรรทัดที่ 3: รวมก่อนหัก */}
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 5,
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '42%', fontSize: 8.5, color: T.label, fontWeight: 700 }}>
                รวมมูลค่าทรัพย์สิน
              </PdfText>
              <PdfText style={{ flex: 1, fontSize: 8.5, color: T.text, fontWeight: 700 }}>
                ฿{formatCurrency(totalGross)}
              </PdfText>
            </PdfView>

            {/* บรรทัดที่ 4: หัก ค่าเสื่อมราคา */}
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '42%', fontSize: 8.5, color: T.label }}>
                หัก ค่าเสื่อมราคา ({(depRate * 100).toFixed(0)}%)
              </PdfText>
              <PdfText style={{ flex: 1, fontSize: 8.5, color: '#dc2626' }}>
                -{formatCurrency(depAmount)}
              </PdfText>
            </PdfView>

            {/* กล่องไฮไลต์: มูลค่าประเมินสุทธิ */}
            <PdfView
              style={{
                backgroundColor: T.highlight,
                borderWidth: 1,
                borderColor: '#bfdbfe',
                borderStyle: 'solid',
                borderRadius: 3,
                padding: 8,
                marginTop: 6,
              }}
            >
              <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <PdfText style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                  มูลค่าประเมินสุทธิ
                </PdfText>
                <PdfText style={{ fontSize: 18, fontWeight: 700, color: T.blue }}>
                  ฿{formatCurrency(netValue)}
                </PdfText>
              </PdfView>
              {/* คำอ่านภาษาไทย */}
              <PdfText style={{ fontSize: 8, color: T.label, marginTop: 3, textAlign: 'right' }}>
                {toThaiBahtText(netValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>

          {/* 3. สรุปการเปรียบเทียบตลาด */}
          <FieldsetBox label="สรุปการเปรียบเทียบตลาด">
            {/* Header แถบสีเทา */}
            <PdfView
              style={{
                flexDirection: 'row',
                backgroundColor: T.bgHeader,
                paddingVertical: 5,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: T.border,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '8%',  fontSize: 7.5, fontWeight: 700, textAlign: 'center' }}>ลำดับ</PdfText>
              <PdfText style={{ width: '40%', fontSize: 7.5, fontWeight: 700 }}>ทรัพย์จดเทียบเคียง</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, fontWeight: 700, textAlign: 'center' }}>เนื้อที่ (ตร.ว.)</PdfText>
              <PdfText style={{ flex: 1,       fontSize: 7.5, fontWeight: 700, textAlign: 'right' }}>ราคาขาย</PdfText>
            </PdfView>
            {compareRows.map(([no, name, area, price], idx) => (
              <PdfView
                key={no}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 4.5,
                  paddingHorizontal: 4,
                  backgroundColor: idx % 2 === 0 ? T.bg : T.bgGray,
                  borderBottomWidth: 1,
                  borderBottomColor: T.borderLight,
                  borderBottomStyle: 'solid',
                }}
              >
                <PdfText style={{ width: '8%',  fontSize: 8, textAlign: 'center', color: T.muted }}>{no}</PdfText>
                <PdfText style={{ width: '40%', fontSize: 8, color: T.text }}>{name}</PdfText>
                <PdfText style={{ width: '22%', fontSize: 8, textAlign: 'center', color: T.muted }}>{area}</PdfText>
                <PdfText style={{ flex: 1,       fontSize: 8, textAlign: 'right', color: T.text }}>
                  {formatCurrency(price)}
                </PdfText>
              </PdfView>
            ))}
            {/* ค่ากลางตลาด */}
            <PdfView style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 5 }}>
              <PdfText style={{ fontSize: 8.5, fontWeight: 700 }}>ค่ากลางตลาด (Median)</PdfText>
              <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: T.blue }}>
                ฿{formatCurrency(medianValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>
        </PdfView>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
        <PdfView style={{ width: '41%' }}>

          {/* แผนผัง / รูปโฉนด */}
          <FieldsetBox label="แผนผังที่ดิน" style={{ marginBottom: 10 }}>
            <PhotoBox
              src={deedImageUrl}
              label="แผนผังที่ดิน"
              style={{ height: 148 }}
            />
          </FieldsetBox>

          {/* รายละเอียดการประเมิน — 4 columns */}
          <FieldsetBox label="รายละเอียดการประเมิน" style={{ marginBottom: 10 }}>
            {/* Header */}
            <PdfView
              style={{
                flexDirection: 'row',
                backgroundColor: T.bgHeader,
                paddingVertical: 4,
                paddingHorizontal: 3,
                borderBottomWidth: 1,
                borderBottomColor: T.border,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '32%', fontSize: 7, fontWeight: 700 }}>รายการ</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7, fontWeight: 700, textAlign: 'right' }}>เนื้อที่</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7, fontWeight: 700, textAlign: 'right' }}>ราคา/หน่วย</PdfText>
              <PdfText style={{ flex: 1,       fontSize: 7, fontWeight: 700, textAlign: 'right' }}>รวม</PdfText>
            </PdfView>
            {/* ที่ดิน */}
            <PdfView style={{ flexDirection: 'row', paddingVertical: 4.5, paddingHorizontal: 3, borderBottomWidth: 1, borderBottomColor: T.borderLight, borderBottomStyle: 'solid' }}>
              <PdfText style={{ width: '32%', fontSize: 7.5 }}>ราคาที่ดิน</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right', color: T.muted }}>
                {sqWah ? `${sqWah} ตร.ว.` : areaText}
              </PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right', color: T.muted }}>
                {pricePerSqWah ? `${formatCurrency(pricePerSqWah)}` : '-'}
              </PdfText>
              <PdfText style={{ flex: 1, fontSize: 7.5, textAlign: 'right' }}>
                {formatCurrency(landValue)}
              </PdfText>
            </PdfView>
            {/* สิ่งปลูกสร้าง */}
            <PdfView style={{ flexDirection: 'row', paddingVertical: 4.5, paddingHorizontal: 3, borderBottomWidth: 1, borderBottomColor: T.borderLight, borderBottomStyle: 'solid' }}>
              <PdfText style={{ width: '32%', fontSize: 7.5 }}>สิ่งปลูกสร้าง</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right', color: T.muted }}>-</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right', color: T.muted }}>-</PdfText>
              <PdfText style={{ flex: 1, fontSize: 7.5, textAlign: 'right' }}>
                {formatCurrency(buildValue)}
              </PdfText>
            </PdfView>
            {/* ค่าเสื่อม */}
            <PdfView style={{ flexDirection: 'row', paddingVertical: 4.5, paddingHorizontal: 3, borderBottomWidth: 1, borderBottomColor: T.borderLight, borderBottomStyle: 'solid' }}>
              <PdfText style={{ width: '32%', fontSize: 7.5 }}>ค่าเสื่อมราคา</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right', color: T.muted }}>-</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right', color: T.muted }}>10%</PdfText>
              <PdfText style={{ flex: 1, fontSize: 7.5, textAlign: 'right', color: '#dc2626' }}>
                -{formatCurrency(depAmount)}
              </PdfText>
            </PdfView>
            {/* รวม */}
            <PdfView style={{ flexDirection: 'row', paddingVertical: 4.5, paddingHorizontal: 3 }}>
              <PdfText style={{ width: '32%', fontSize: 7.5, fontWeight: 700 }}>รวม</PdfText>
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right' }} />
              <PdfText style={{ width: '22%', fontSize: 7.5, textAlign: 'right' }} />
              <PdfText style={{ flex: 1, fontSize: 7.5, fontWeight: 700, textAlign: 'right', color: T.blue }}>
                {formatCurrency(netValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>

          {/* หมายเหตุ */}
          <FieldsetBox label="หมายเหตุ" style={{ marginBottom: 10 }}>
            {[
              'ราคาประเมินเพื่อใช้ประกอบการพิจารณาสินเชื่อ',
              'อ้างอิงจากราคาตลาดและสภาพทรัพย์ปัจจุบัน',
              'ค่าประเมินอาจเปลี่ยนแปลงตามภาวะตลาด',
            ].map((note, i) => (
              <PdfView key={i} style={{ flexDirection: 'row', marginTop: i === 0 ? 2 : 3 }}>
                <PdfText style={{ fontSize: 8, color: T.muted, marginRight: 4 }}>•</PdfText>
                <PdfText style={{ flex: 1, fontSize: 8, color: T.muted, lineHeight: 1.35 }}>
                  {note}
                </PdfText>
              </PdfView>
            ))}
          </FieldsetBox>

          {/* รูปถ่ายทรัพย์สิน: 1 ใหญ่ซ้าย + 2 เล็กขวา */}
          <FieldsetBox label="รูปถ่ายทรัพย์สิน" style={{ position: 'relative' }}>
            <PdfView style={{ flexDirection: 'row', gap: 4, height: 88 }}>
              {/* รูปใหญ่ */}
              <PhotoBox src={largePhoto} label="รูปที่ 1" style={{ flex: 2, height: '100%' }} />
              {/* 2 รูปเล็ก */}
              <PdfView style={{ flex: 1, gap: 4 }}>
                <PhotoBox src={smallPhoto1} label="รูปที่ 2" style={{ flex: 1 }} />
                <PhotoBox src={smallPhoto2} label="รูปที่ 3" style={{ flex: 1 }} />
              </PdfView>
            </PdfView>

            {/* ตราประทับบริษัท — มุมขวาล่าง */}
            <PdfView
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: T.border,
                borderStyle: 'solid',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.85)',
              }}
            >
              <PdfText style={{ fontSize: 5.5, color: T.muted, textAlign: 'center', lineHeight: 1.3 }}>
                InfiniteX{'\n'}STAMP
              </PdfText>
            </PdfView>
          </FieldsetBox>
        </PdfView>
      </PdfView>

      {/* ── SIGNATURE SECTION ──────────────────────────────────────────── */}
      <PdfView style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
        <PdfView style={{ width: '52%', flexDirection: 'row', gap: 20 }}>
          {/* ผู้ประเมิน */}
          <PdfView style={{ flex: 1, alignItems: 'center' }}>
            <PdfText style={{ fontSize: 8, color: T.muted, marginBottom: 18 }}>ลงชื่อ</PdfText>
            <PdfView style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: T.text, borderBottomStyle: 'solid', marginBottom: 4 }} />
            <PdfText style={{ fontSize: 8, color: T.muted }}>(...................................)</PdfText>
            <PdfText style={{ fontSize: 7.5, color: T.muted, marginTop: 2 }}>ผู้ประเมินราคาทรัพย์สิน</PdfText>
            <PdfView style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: T.borderLight, borderBottomStyle: 'dashed', marginTop: 8, marginBottom: 4 }} />
            <PdfText style={{ fontSize: 7.5, color: T.muted }}>วันที่ ......../........../..........พ.ศ.</PdfText>
          </PdfView>
          {/* หัวหน้าฝ่ายประเมิน */}
          <PdfView style={{ flex: 1, alignItems: 'center' }}>
            <PdfText style={{ fontSize: 8, color: T.muted, marginBottom: 18 }}>อนุมัติโดย</PdfText>
            <PdfView style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: T.text, borderBottomStyle: 'solid', marginBottom: 4 }} />
            <PdfText style={{ fontSize: 8, color: T.muted }}>(...................................)</PdfText>
            <PdfText style={{ fontSize: 7.5, color: T.muted, marginTop: 2 }}>หัวหน้าฝ่ายสินเชื่อ</PdfText>
            <PdfView style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: T.borderLight, borderBottomStyle: 'dashed', marginTop: 8, marginBottom: 4 }} />
            <PdfText style={{ fontSize: 7.5, color: T.muted }}>วันที่ ......../........../..........พ.ศ.</PdfText>
          </PdfView>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
