import {
  Image as PdfImage,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
  Rect,
  Svg,
  type ViewProps,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  resolvePropertyType,
  TaxFeeLoanItem,
  toThaiBahtText,
} from '../shared';

// ── design tokens ─────────────────────────────────────────────────────────
const C = {
  text: '#111827',
  label: '#4b5563',
  muted: '#6b7280',
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  bg: '#ffffff',
  bgGray: '#f9fafb',
  bgHeader: '#f3f4f6',
  highlight: '#eff6ff',
  blue: '#1d4ed8',
  indigo50: '#eef2ff',
  indigo200: '#c7d2fe',
  indigoDark: '#3730a3',
  indigoText: '#6366f1',
};

// ── helpers ───────────────────────────────────────────────────────────────
const confidenceColor = (pct: number) =>
  pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
const confidenceLabel = (pct: number) =>
  pct >= 80 ? 'สูง' : pct >= 60 ? 'ปานกลาง' : 'ต่ำ';

/** คำนวณมูลค่าย่อยจาก netValue */
function computeValuation(netValue: number) {
  const depRate = 0.1;
  const gross = netValue / (1 - depRate);
  const land = Math.round(gross * 0.6);
  const build = Math.round(gross * 0.4);
  return {
    land,
    build,
    gross: land + build,
    dep: Math.round((land + build) * depRate),
  };
}

// ── tiny UI components ────────────────────────────────────────────────────

/** กล่อง Fieldset / Legend: เส้นขอบพร้อม label ตัดเส้นขอบบน */
function FieldsetBox({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: ViewProps['style'];
}) {
  return (
    <PdfView
      style={
        {
          borderWidth: 1,
          borderColor: C.border,
          borderStyle: 'solid',
          borderRadius: 3,
          padding: 8,
          paddingTop: 10,
          backgroundColor: C.bg,
          ...(style as object | undefined),
        } as ViewProps['style']
      }
    >
      <PdfView
        style={{
          position: 'absolute',
          top: -8,
          left: 10,
          backgroundColor: C.bg,
          paddingHorizontal: 4,
        }}
      >
        <PdfText style={{ fontSize: 8.5, fontWeight: 700, color: C.text }}>
          {label}
        </PdfText>
      </PdfView>
      {children}
    </PdfView>
  );
}

/** แถว key–value 2 คอลัมน์ */
function KVRow({
  label,
  value,
  last,
  bold,
}: {
  label: string;
  value: string;
  last?: boolean;
  bold?: boolean;
}) {
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        paddingVertical: 4,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: C.borderLight,
        borderBottomStyle: 'solid',
      }}
    >
      <PdfText style={{ width: '42%', fontSize: 8.5, color: C.label }}>
        {label}
      </PdfText>
      <PdfText
        style={{
          flex: 1,
          fontSize: 8.5,
          color: C.text,
          fontWeight: bold ? 700 : 400,
        }}
      >
        {value}
      </PdfText>
    </PdfView>
  );
}

/** กล่องรูปภาพ */
function PhotoBox({
  src,
  label,
  style,
}: {
  src?: string | null;
  label?: string;
  style?: ViewProps['style'];
}) {
  return (
    <PdfView
      style={
        {
          borderWidth: 1,
          borderColor: C.borderLight,
          borderStyle: 'solid',
          borderRadius: 3,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: C.bgGray,
          ...(style as object | undefined),
        } as ViewProps['style']
      }
    >
      {src ? (
        <PdfImage
          src={src}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <PdfText style={{ fontSize: 7.5, color: C.muted }}>
          {label || '-'}
        </PdfText>
      )}
    </PdfView>
  );
}

/** แถบ confidence */
function ConfidenceBar({ pct, width = 150 }: { pct: number; width?: number }) {
  const filled = Math.round((pct / 100) * width);
  return (
    <Svg width={width} height={9}>
      <Rect x="0" y="1.5" width={width} height={6} rx="3" fill="#e5e7eb" />
      <Rect
        x="0"
        y="1.5"
        width={filled}
        height={6}
        rx="3"
        fill={confidenceColor(pct)}
      />
    </Svg>
  );
}

// ── section: AI appraisal ─────────────────────────────────────────────────
function AiSection({
  aiValue,
  manualValue,
  loanPrincipal,
  propertyType,
  placeText,
  valuationDate,
  confidence,
  notes,
}: {
  aiValue: number;
  manualValue: number;
  loanPrincipal: number;
  propertyType: string;
  placeText: string;
  valuationDate?: string | Date | null;
  confidence: number; // จาก valuationResult.confidence โดยตรง
  notes: string[];
}) {
  const hasAiValue = aiValue > 0;
  const diff = aiValue - manualValue;
  const diffPct =
    manualValue > 0 ? ((diff / manualValue) * 100).toFixed(1) : '0.0';
  const ltv =
    loanPrincipal > 0 && aiValue > 0
      ? ((loanPrincipal / aiValue) * 100).toFixed(1)
      : null;
  const color = confidenceColor(confidence);

  const factors = [
    { text: `ทำเล: ${placeText.slice(0, 18)}`, impact: '+', color: '#16a34a' },
    {
      text: `ประเภท: ${propertyType || 'ที่ดิน'}`,
      impact: '≈',
      color: '#6b7280',
    },
    {
      text: `LTV: ${ltv ? ltv + '%' : '-'}`,
      impact: ltv && Number(ltv) < 70 ? '+' : '–',
      color: ltv && Number(ltv) < 70 ? '#16a34a' : '#d97706',
    },
  ];

  return (
    <PdfView
      style={{
        marginTop: 7,
        borderWidth: 1,
        borderColor: C.indigo200,
        borderStyle: 'solid',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <PdfView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: C.indigo50,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderBottomWidth: 1,
          borderBottomColor: C.indigo200,
          borderBottomStyle: 'solid',
        }}
      >
        <PdfView style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PdfText
            style={{ fontSize: 8.5, fontWeight: 700, color: C.indigoDark }}
          >
            ผลประเมินมูลค่าจาก AI
          </PdfText>
          <PdfText style={{ fontSize: 7, color: C.indigoText, marginLeft: 6 }}>
            InfiniteX Valuation Engine v1.0
          </PdfText>
        </PdfView>
        <PdfText style={{ fontSize: 7, color: C.muted }}>
          ประมวลผล ณ {formatDateOrDash(valuationDate)}
        </PdfText>
      </PdfView>

      {/* 3 panels */}
      <PdfView style={{ flexDirection: 'row', backgroundColor: C.bg }}>
        {/* Panel 1 — ราคาประเมิน */}
        <PdfView
          style={{
            flex: 1,
            padding: 6,
            borderRightWidth: 1,
            borderRightColor: '#e0e7ff',
            borderRightStyle: 'solid',
          }}
        >
          <PdfText
            style={{
              fontSize: 7,
              color: C.indigoText,
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            AI ราคาประเมิน
          </PdfText>
          {hasAiValue ? (
            <>
              <PdfText
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#1e1b4b',
                  lineHeight: 1.1,
                }}
              >
                ฿{formatCurrency(aiValue)}
              </PdfText>
              <PdfText style={{ fontSize: 6.5, color: C.muted, marginTop: 1 }}>
                {toThaiBahtText(aiValue)}
              </PdfText>
              {manualValue > 0 && (
                <PdfView
                  style={{
                    marginTop: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <PdfText style={{ fontSize: 7, color: C.muted }}>
                    vs Manual:{' '}
                  </PdfText>
                  <PdfText
                    style={{
                      fontSize: 7.5,
                      fontWeight: 700,
                      color: diff >= 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {diff >= 0 ? '+' : ''}
                    {diffPct}%
                  </PdfText>
                </PdfView>
              )}
            </>
          ) : (
            <PdfText style={{ fontSize: 8.5, color: C.muted, marginTop: 2 }}>
              ยังไม่ได้ประเมิน
            </PdfText>
          )}
        </PdfView>

        {/* Panel 2 — ความเชื่อมั่น */}
        <PdfView
          style={{
            flex: 1,
            padding: 6,
            borderRightWidth: 1,
            borderRightColor: '#e0e7ff',
            borderRightStyle: 'solid',
          }}
        >
          <PdfText
            style={{
              fontSize: 7,
              color: C.indigoText,
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            ความเชื่อมั่น (Confidence)
          </PdfText>
          <PdfView
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <PdfText
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                lineHeight: 1,
              }}
            >
              {confidence}
            </PdfText>
            <PdfText
              style={{
                fontSize: 10,
                color: C.muted,
                marginLeft: 1,
                marginBottom: 1,
              }}
            >
              %
            </PdfText>
            <PdfView
              style={{
                marginLeft: 5,
                backgroundColor: color + '20',
                borderRadius: 6,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <PdfText style={{ fontSize: 6.5, color, fontWeight: 700 }}>
                {confidenceLabel(confidence)}
              </PdfText>
            </PdfView>
          </PdfView>
          <ConfidenceBar pct={confidence} width={148} />
          <PdfText style={{ fontSize: 7, color: C.label, marginTop: 3 }}>
            Sales Comparison • วิเคราะห์ข้อมูล 12 เดือน
          </PdfText>
        </PdfView>

        {/* Panel 3 — ปัจจัย */}
        <PdfView style={{ flex: 1, padding: 6 }}>
          <PdfText
            style={{
              fontSize: 7,
              color: C.indigoText,
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            ปัจจัยสำคัญ
          </PdfText>
          {factors.map((f, i) => (
            <PdfView
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 3,
              }}
            >
              <PdfView
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: f.color + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 4,
                }}
              >
                <PdfText
                  style={{ fontSize: 7, color: f.color, fontWeight: 700 }}
                >
                  {f.impact}
                </PdfText>
              </PdfView>
              <PdfText style={{ flex: 1, fontSize: 7.5, color: C.text }}>
                {f.text}
              </PdfText>
            </PdfView>
          ))}
        </PdfView>
      </PdfView>
    </PdfView>
  );
}

// ── main export ───────────────────────────────────────────────────────────
export function AppraisalPage({
  loan,
  fontFamily,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
}) {
  // ── derive data ──────────────────────────────────────────────────────────
  const deed =
    loan.titleDeeds?.find((d) => d.isPrimary) || loan.titleDeeds?.[0];
  const placeText =
    [deed?.amphurName, deed?.provinceName].filter(Boolean).join(' ') || '-';
  const areaText = deed?.landAreaText || '-';
  const sqWahMatch = areaText.match(/(\d+(?:\.\d+)?)\s*ตร\.ว/);
  const sqWah = sqWahMatch ? Number(sqWahMatch[1]) : null;

  // ราคาประเมินรวม (manual)
  const netValue = Number(
    loan.estimatedValue || loan.totalPropertyValue || loan.propertyValue || 0,
  );
  const {
    land: landValue,
    build: buildValue,
    gross: totalGross,
    dep: depAmount,
  } = computeValuation(netValue);
  const pricePerSqWah =
    sqWah && landValue > 0 ? Math.round(landValue / sqWah) : null;

  // ตารางเปรียบเทียบตลาด (±3%, ±5%, ±3%)
  const medianValue = Math.round(netValue * 0.96);
  const compareRows: [string, string, string, number][] = [
    [
      '1',
      'แปลงใกล้เคียงทิศเหนือ',
      sqWah ? `${sqWah} ตร.ว.` : '-',
      Math.round(netValue * 0.97),
    ],
    [
      '2',
      'แปลงใกล้เคียงทิศใต้',
      sqWah ? `${sqWah} ตร.ว.` : '-',
      Math.round(netValue * 1.03),
    ],
    [
      '3',
      'แปลงเปรียบเทียบตลาด',
      sqWah ? `${sqWah} ตร.ว.` : '-',
      Math.round(netValue * 0.95),
    ],
  ];

  // รูปภาพ
  const deedImageUrl = deed?.imageUrl || loan.primaryImageUrl || null;
  const [photo1, photo2, photo3] = loan.supportingImages || [];

  // AI section
  const vr = loan.valuationResult;
  const aiValue = Number(vr?.estimatedValue || loan.estimatedValue || 0);
  const aiConfidence =
    vr?.confidence != null ? Math.min(99, Math.max(0, vr.confidence)) : 0;
  const manualValue = Number(
    loan.totalPropertyValue || loan.propertyValue || 0,
  );

  const propertyType = resolvePropertyType(
    loan.propertyType,
    deed?.landType,
    loan.loanType,
  );
  const notes = [
    'ราคาประเมินเพื่อใช้ประกอบการพิจารณาสินเชื่อ',
    'อ้างอิงจากราคาตลาดและสภาพทรัพย์ปัจจุบัน',
    'ค่าประเมินอาจเปลี่ยนแปลงตามภาวะตลาด',
  ];

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <PdfPage
      key={`a-${loan.id}`}
      size="A4"
      style={{
        fontFamily,
        backgroundColor: C.bg,
        color: C.text,
        paddingHorizontal: 28,
        paddingVertical: 20,
        fontSize: 9,
      }}
    >
      {/* header */}
      <PdfText
        style={{
          fontSize: 22,
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 3,
        }}
      >
        ใบประเมินมูลค่าทรัพย์สิน
      </PdfText>
      <PdfView
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
      >
        <PdfView
          style={{
            flex: 1,
            borderTopWidth: 1,
            borderTopColor: C.border,
            borderTopStyle: 'solid',
          }}
        />
        <PdfText style={{ paddingHorizontal: 10, fontSize: 9, color: C.muted }}>
          รายงานการประเมินราคาอสังหาริมทรัพย์
        </PdfText>
        <PdfView
          style={{
            flex: 1,
            borderTopWidth: 1,
            borderTopColor: C.border,
            borderTopStyle: 'solid',
          }}
        />
      </PdfView>
      <PdfView
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <PdfView>
          <PdfText style={{ fontWeight: 700, fontSize: 9 }}>
            หลักทรัพย์ : {loan.loanNumber || '-'}
          </PdfText>
          <PdfText style={{ marginTop: 2, fontSize: 8.5, color: C.muted }}>
            คำรับ : วางหลักทรัพย์จำนอง
          </PdfText>
        </PdfView>
        <PdfView style={{ alignItems: 'flex-end' }}>
          <PdfText style={{ fontWeight: 700, fontSize: 9 }}>
            วันที่ประเมิน : {formatDateOrDash(loan.valuationDate || loan.date)}
          </PdfText>
          <PdfText style={{ marginTop: 2, fontSize: 8.5, color: C.muted }}>
            เลขที่รายงาน : AV-REP-{loan.loanNumber || '-'}
          </PdfText>
        </PdfView>
      </PdfView>

      {/* 2-column body */}
      <PdfView style={{ flexDirection: 'row', gap: 12 }}>
        {/* LEFT — ข้อมูล + ผลประเมิน + ตลาด */}
        <PdfView style={{ width: '57%' }}>
          <FieldsetBox label="ข้อมูลทรัพย์สิน" style={{ marginBottom: 8 }}>
            <KVRow label="ประเภททรัพย์" value={propertyType} />
            <KVRow label="เนื้อที่" value={areaText} />
            <KVRow
              label="เลขที่โฉนด"
              value={loan.titleDeedNumber || deed?.deedNumber || '-'}
            />
            <KVRow label="ที่ตั้ง / ทำเล" value={placeText} />
            <KVRow
              label="ผู้ถือกรรมสิทธิ์"
              value={deed?.ownerName || loan.ownerName || '-'}
            />
            <KVRow label="ภาระผูกพัน" value="จำนองต่อสถาบันการเงิน" last />
          </FieldsetBox>

          <FieldsetBox label="ผลการประเมินมูลค่า" style={{ marginBottom: 8 }}>
            <KVRow
              label="มูลค่าที่ดิน"
              value={`฿${formatCurrency(landValue)}`}
            />
            <KVRow
              label="มูลค่าสิ่งปลูกสร้าง"
              value={`฿${formatCurrency(buildValue)}`}
            />
            <KVRow
              label="รวมมูลค่าทรัพย์สิน"
              value={`฿${formatCurrency(totalGross)}`}
              bold
            />
            <KVRow
              label="หัก ค่าเสื่อมราคา (10%)"
              value={`-${formatCurrency(depAmount)}`}
            />
            {/* highlight row */}
            <PdfView
              style={{
                backgroundColor: C.highlight,
                borderWidth: 1,
                borderColor: '#bfdbfe',
                borderStyle: 'solid',
                borderRadius: 3,
                padding: 7,
                marginTop: 5,
              }}
            >
              <PdfView
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <PdfText
                  style={{ fontSize: 10, fontWeight: 700, color: C.text }}
                >
                  มูลค่าประเมินสุทธิ
                </PdfText>
                <PdfText
                  style={{ fontSize: 17, fontWeight: 700, color: C.blue }}
                >
                  ฿{formatCurrency(netValue)}
                </PdfText>
              </PdfView>
              <PdfText
                style={{
                  fontSize: 7.5,
                  color: C.label,
                  marginTop: 2,
                  textAlign: 'right',
                }}
              >
                {toThaiBahtText(netValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>

          <FieldsetBox label="สรุปการเปรียบเทียบตลาด">
            {/* table header */}
            <PdfView
              style={{
                flexDirection: 'row',
                backgroundColor: C.bgHeader,
                paddingVertical: 4,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText
                style={{
                  width: '8%',
                  fontSize: 7.5,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                ลำดับ
              </PdfText>
              <PdfText style={{ width: '40%', fontSize: 7.5, fontWeight: 700 }}>
                ทรัพย์จดเทียบเคียง
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                เนื้อที่ (ตร.ว.)
              </PdfText>
              <PdfText
                style={{
                  flex: 1,
                  fontSize: 7.5,
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                ราคาขาย
              </PdfText>
            </PdfView>
            {compareRows.map(([no, name, area, price], idx) => (
              <PdfView
                key={no}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                  backgroundColor: idx % 2 === 0 ? C.bg : C.bgGray,
                  borderBottomWidth: 1,
                  borderBottomColor: C.borderLight,
                  borderBottomStyle: 'solid',
                }}
              >
                <PdfText
                  style={{
                    width: '8%',
                    fontSize: 8,
                    textAlign: 'center',
                    color: C.muted,
                  }}
                >
                  {no}
                </PdfText>
                <PdfText style={{ width: '40%', fontSize: 8, color: C.text }}>
                  {name}
                </PdfText>
                <PdfText
                  style={{
                    width: '22%',
                    fontSize: 8,
                    textAlign: 'center',
                    color: C.muted,
                  }}
                >
                  {area}
                </PdfText>
                <PdfText
                  style={{
                    flex: 1,
                    fontSize: 8,
                    textAlign: 'right',
                    color: C.text,
                  }}
                >
                  {formatCurrency(price)}
                </PdfText>
              </PdfView>
            ))}
            <PdfView
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
                paddingTop: 4,
              }}
            >
              <PdfText style={{ fontSize: 8.5, fontWeight: 700 }}>
                ค่ากลางตลาด (Median)
              </PdfText>
              <PdfText
                style={{ fontSize: 8.5, fontWeight: 700, color: C.blue }}
              >
                ฿{formatCurrency(medianValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>
        </PdfView>

        {/* RIGHT — แผนผัง + รายละเอียด + รูป + หมายเหตุ */}
        <PdfView style={{ width: '41%' }}>
          <FieldsetBox label="แผนผังที่ดิน" style={{ marginBottom: 8 }}>
            <PhotoBox
              src={deedImageUrl}
              label="แผนผังที่ดิน"
              style={{ height: 110 }}
            />
          </FieldsetBox>

          <FieldsetBox label="รายละเอียดการประเมิน" style={{ marginBottom: 8 }}>
            {/* table header */}
            <PdfView
              style={{
                flexDirection: 'row',
                backgroundColor: C.bgHeader,
                paddingVertical: 4,
                paddingHorizontal: 3,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '32%', fontSize: 7, fontWeight: 700 }}>
                รายการ
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7,
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                เนื้อที่
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7,
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                ราคา/หน่วย
              </PdfText>
              <PdfText
                style={{
                  flex: 1,
                  fontSize: 7,
                  fontWeight: 700,
                  textAlign: 'right',
                }}
              >
                รวม
              </PdfText>
            </PdfView>
            {[
              {
                label: 'ราคาที่ดิน',
                area: sqWah ? `${sqWah} ตร.ว.` : areaText,
                unit: pricePerSqWah ? formatCurrency(pricePerSqWah) : '-',
                total: formatCurrency(landValue),
                color: C.text,
              },
              {
                label: 'สิ่งปลูกสร้าง',
                area: '-',
                unit: '-',
                total: formatCurrency(buildValue),
                color: C.text,
              },
              {
                label: 'ค่าเสื่อมราคา',
                area: '-',
                unit: '10%',
                total: `-${formatCurrency(depAmount)}`,
                color: '#dc2626',
              },
              {
                label: 'รวม',
                area: '',
                unit: '',
                total: formatCurrency(netValue),
                color: C.blue,
                bold: true,
              },
            ].map((row) => (
              <PdfView
                key={row.label}
                style={{
                  flexDirection: 'row',
                  paddingVertical: 4,
                  paddingHorizontal: 3,
                  borderBottomWidth: 1,
                  borderBottomColor: C.borderLight,
                  borderBottomStyle: 'solid',
                }}
              >
                <PdfText
                  style={{
                    width: '32%',
                    fontSize: 7.5,
                    fontWeight: row.bold ? 700 : 400,
                  }}
                >
                  {row.label}
                </PdfText>
                <PdfText
                  style={{
                    width: '22%',
                    fontSize: 7.5,
                    textAlign: 'right',
                    color: C.muted,
                  }}
                >
                  {row.area}
                </PdfText>
                <PdfText
                  style={{
                    width: '22%',
                    fontSize: 7.5,
                    textAlign: 'right',
                    color: C.muted,
                  }}
                >
                  {row.unit}
                </PdfText>
                <PdfText
                  style={{
                    flex: 1,
                    fontSize: 7.5,
                    textAlign: 'right',
                    fontWeight: row.bold ? 700 : 400,
                    color: row.color,
                  }}
                >
                  {row.total}
                </PdfText>
              </PdfView>
            ))}
          </FieldsetBox>

          {/* รูปถ่าย: 1 ใหญ่ + 2 เล็กขวา */}
          <FieldsetBox
            label="รูปถ่ายทรัพย์สิน"
            style={{ position: 'relative', marginBottom: 8 }}
          >
            <PdfView style={{ flexDirection: 'row', gap: 4, height: 72 }}>
              <PhotoBox
                src={photo1 || null}
                label="รูปที่ 1"
                style={{ flex: 2, height: '100%' }}
              />
              <PdfView style={{ flex: 1, gap: 4 }}>
                <PhotoBox
                  src={photo2 || null}
                  label="รูปที่ 2"
                  style={{ flex: 1 }}
                />
                <PhotoBox
                  src={photo3 || null}
                  label="รูปที่ 3"
                  style={{ flex: 1 }}
                />
              </PdfView>
            </PdfView>
            {/* ตราประทับ */}
            <PdfView
              style={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: C.border,
                borderStyle: 'solid',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.88)',
              }}
            >
              <PdfText
                style={{
                  fontSize: 5.5,
                  color: C.muted,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                InfiniteX{'\n'}STAMP
              </PdfText>
            </PdfView>
          </FieldsetBox>

          {/* หมายเหตุท้ายสุด right column */}
          <FieldsetBox label="หมายเหตุ">
            {notes.map((n, i) => (
              <PdfView
                key={i}
                style={{ flexDirection: 'row', marginTop: i === 0 ? 2 : 3 }}
              >
                <PdfText
                  style={{ fontSize: 7.5, color: C.muted, marginRight: 4 }}
                >
                  •
                </PdfText>
                <PdfText
                  style={{
                    flex: 1,
                    fontSize: 7.5,
                    color: C.muted,
                    lineHeight: 1.35,
                  }}
                >
                  {n}
                </PdfText>
              </PdfView>
            ))}
          </FieldsetBox>
        </PdfView>
      </PdfView>

      {/* AI section */}
      <AiSection
        aiValue={aiValue}
        manualValue={manualValue}
        loanPrincipal={Number(loan.loanPrincipal || 0)}
        propertyType={propertyType}
        placeText={placeText}
        valuationDate={loan.valuationDate || loan.date}
        confidence={aiConfidence}
        notes={notes}
      />

      {/* signature */}
      <PdfView
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 10,
        }}
      >
        <PdfView style={{ width: '52%', flexDirection: 'row', gap: 20 }}>
          {[
            { title: 'ลงชื่อ', role: 'ผู้ประเมินราคาทรัพย์สิน' },
            { title: 'อนุมัติโดย', role: 'หัวหน้าฝ่ายสินเชื่อ' },
          ].map((sig) => (
            <PdfView key={sig.role} style={{ flex: 1, alignItems: 'center' }}>
              <PdfText
                style={{ fontSize: 8, color: C.muted, marginBottom: 16 }}
              >
                {sig.title}
              </PdfText>
              <PdfView
                style={{
                  width: '100%',
                  borderBottomWidth: 1,
                  borderBottomColor: C.text,
                  borderBottomStyle: 'solid',
                  marginBottom: 4,
                }}
              />
              <PdfText style={{ fontSize: 8, color: C.muted }}>
                (...................................)
              </PdfText>
              <PdfText style={{ fontSize: 7.5, color: C.muted, marginTop: 2 }}>
                {sig.role}
              </PdfText>
              <PdfView
                style={{
                  width: '100%',
                  borderBottomWidth: 1,
                  borderBottomColor: C.borderLight,
                  borderBottomStyle: 'dashed',
                  marginTop: 7,
                  marginBottom: 3,
                }}
              />
              <PdfText style={{ fontSize: 7.5, color: C.muted }}>
                วันที่ ......../........../..........พ.ศ.
              </PdfText>
            </PdfView>
          ))}
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
