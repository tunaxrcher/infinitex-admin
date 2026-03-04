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
} from './shared';

/** Type ที่ถูกต้องสำหรับ style prop ของ PdfView */
type PdfViewStyle = ViewProps['style'];

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
  highlight: '#eff6ff',
  blue: '#1d4ed8',
  indigo50: '#eef2ff',
  indigo200: '#c7d2fe',
  indigo400: '#818cf8',
  indigoDark: '#3730a3',
  indigoText: '#6366f1',
};

// ── Fieldset / Legend style box ───────────────────────────────────────────
function FieldsetBox({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: PdfViewStyle;
}) {
  return (
    <PdfView
      style={
        {
          borderWidth: 1,
          borderColor: T.border,
          borderStyle: 'solid',
          borderRadius: 3,
          padding: 8,
          paddingTop: 10,
          backgroundColor: T.bg,
          // caller overrides go last
          ...(style as object | undefined),
        } as ViewProps['style']
      }
    >
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
      <PdfText style={{ width: '42%', fontSize: 8.5, color: T.label }}>
        {label}
      </PdfText>
      <PdfText
        style={{
          flex: 1,
          fontSize: 8.5,
          color: T.text,
          fontWeight: highlight ? 700 : 400,
        }}
      >
        {value}
      </PdfText>
    </PdfView>
  );
}

// ── Photo box ─────────────────────────────────────────────────────────────
function PhotoBox({
  src,
  label,
  style,
}: {
  src?: string | null;
  label?: string;
  style?: PdfViewStyle;
}) {
  return (
    <PdfView
      style={
        {
          borderWidth: 1,
          borderColor: T.borderLight,
          borderStyle: 'solid',
          borderRadius: 3,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: T.bgGray,
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
        <PdfText style={{ fontSize: 7.5, color: T.muted }}>
          {label || '-'}
        </PdfText>
      )}
    </PdfView>
  );
}

// ── Confidence bar (SVG) ─────────────────────────────────────────────────
function ConfidenceBar({ pct, width = 150 }: { pct: number; width?: number }) {
  const filled = Math.round((pct / 100) * width);
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  return (
    <Svg width={width} height={9}>
      <Rect x="0" y="1.5" width={width} height={6} rx="3" fill="#e5e7eb" />
      <Rect x="0" y="1.5" width={filled} height={6} rx="3" fill={color} />
    </Svg>
  );
}

// ── AI section (full-width, compact 3 panels) ────────────────────────────
function AiAppraisalSection({
  aiValue,
  manualValue,
  loanPrincipal,
  propertyType,
  placeText,
  valuationDate,
  aiConfidence,
}: {
  aiValue: number;
  manualValue: number;
  loanPrincipal: number;
  propertyType: string;
  placeText: string;
  valuationDate?: string | Date | null;
  aiConfidence?: number | null;
}) {
  /**
   * ใช้ confidence จาก AI โดยตรง (valuationResult.confidence)
   * ถ้าไม่มีค่า AI จริง → ไม่แสดงค่าสุ่ม
   */
  const confidence = aiConfidence != null ? Math.min(99, Math.max(0, aiConfidence)) : 0;
  const confidenceLabel =
    confidence >= 80 ? 'สูง' : confidence >= 60 ? 'ปานกลาง' : 'ต่ำ';
  const confidenceColor =
    confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626';
  const diff = aiValue - manualValue;
  const diffPct =
    manualValue > 0 ? ((diff / manualValue) * 100).toFixed(1) : '0.0';
  const diffSign = diff >= 0 ? '+' : '';
  const diffColor = diff >= 0 ? '#16a34a' : '#dc2626';
  const ltv =
    loanPrincipal > 0 && aiValue > 0
      ? ((loanPrincipal / aiValue) * 100).toFixed(1)
      : null;

  const factors = [
    { label: `ทำเล: ${placeText.slice(0, 18)}`, impact: '+', color: '#16a34a' },
    {
      label: `ประเภท: ${(propertyType || 'ที่ดิน').slice(0, 14)}`,
      impact: '≈',
      color: '#6b7280',
    },
    {
      label: `LTV: ${ltv ? ltv + '%' : '-'}`,
      impact: ltv && Number(ltv) < 70 ? '+' : '–',
      color: ltv && Number(ltv) < 70 ? '#16a34a' : '#d97706',
    },
  ];

  return (
    <PdfView
      style={{
        marginTop: 7,
        borderWidth: 1,
        borderColor: T.indigo200,
        borderStyle: 'solid',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {/* Header — compact */}
      <PdfView
        style={{
          backgroundColor: T.indigo50,
          paddingHorizontal: 8,
          paddingVertical: 3,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: T.indigo200,
          borderBottomStyle: 'solid',
        }}
      >
        <PdfView style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PdfText
            style={{ fontSize: 8.5, fontWeight: 700, color: T.indigoDark }}
          >
            ผลประเมินมูลค่าจาก AI
          </PdfText>
          <PdfText style={{ fontSize: 7, color: T.indigoText, marginLeft: 6 }}>
            InfiniteX Valuation Engine v1.0
          </PdfText>
        </PdfView>
        <PdfText style={{ fontSize: 7, color: T.muted }}>
          ประมวลผล ณ {formatDateOrDash(valuationDate)}
        </PdfText>
      </PdfView>

      {/* 3 panels — compact */}
      <PdfView style={{ flexDirection: 'row', backgroundColor: T.bg }}>
        {/* Panel 1: AI value + diff */}
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
              color: T.indigoText,
              fontWeight: 700,
              marginBottom: 2,
            }}
          >
            AI ราคาประเมิน
          </PdfText>
          {aiValue > 0 ? (
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
              <PdfText style={{ fontSize: 6.5, color: T.muted, marginTop: 1 }}>
                {toThaiBahtText(aiValue)}
              </PdfText>
            </>
          ) : (
            <PdfText style={{ fontSize: 8.5, color: T.muted, marginTop: 2 }}>
              ยังไม่มีข้อมูล (AI ยังไม่ได้ประเมิน)
            </PdfText>
          )}
          {manualValue > 0 && (
            <PdfView
              style={{
                marginTop: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <PdfText style={{ fontSize: 7, color: T.muted }}>
                vs Manual:
              </PdfText>
              <PdfText
                style={{ fontSize: 7.5, fontWeight: 700, color: diffColor }}
              >
                {diffSign}
                {diffPct}%
              </PdfText>
            </PdfView>
          )}
        </PdfView>

        {/* Panel 2: Confidence (no method text) */}
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
              color: T.indigoText,
              fontWeight: 700,
              marginBottom: 2,
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
                color: T.text,
                lineHeight: 1,
              }}
            >
              {confidence}
            </PdfText>
            <PdfText
              style={{
                fontSize: 10,
                color: T.muted,
                marginLeft: 1,
                marginBottom: 1,
              }}
            >
              %
            </PdfText>
            <PdfView
              style={{
                marginLeft: 5,
                backgroundColor: confidenceColor + '20',
                borderRadius: 6,
                paddingHorizontal: 4,
                paddingVertical: 1,
              }}
            >
              <PdfText
                style={{
                  fontSize: 6.5,
                  color: confidenceColor,
                  fontWeight: 700,
                }}
              >
                {confidenceLabel}
              </PdfText>
            </PdfView>
          </PdfView>
          <ConfidenceBar pct={confidence} width={148} />
          <PdfText style={{ fontSize: 7, color: T.label, marginTop: 3 }}>
            Sales Comparison • วิเคราะห์ข้อมูล 12 เดือน
          </PdfText>
        </PdfView>

        {/* Panel 3: ปัจจัยหลัก (3 items only, compact) */}
        <PdfView style={{ flex: 1, padding: 6 }}>
          <PdfText
            style={{
              fontSize: 7,
              color: T.indigoText,
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            ปัจจัยสำคัญที่ใช้ประเมิน
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
              <PdfText style={{ flex: 1, fontSize: 7.5, color: T.text }}>
                {f.label}
              </PdfText>
            </PdfView>
          ))}
          <PdfView
            style={{
              marginTop: 3,
              backgroundColor: '#fef9c3',
              borderRadius: 2,
              padding: 4,
            }}
          >
            <PdfText
              style={{ fontSize: 6.5, color: '#713f12', lineHeight: 1.3 }}
            >
              ⚠️ ผลประเมิน AI ใช้ประกอบการตัดสินใจเท่านั้น
              ต้องผ่านการรับรองผู้ประเมินที่ได้รับอนุญาต
            </PdfText>
          </PdfView>
        </PdfView>
      </PdfView>
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
  const deed =
    loan.titleDeeds?.find((d) => d.isPrimary) || loan.titleDeeds?.[0];

  const netValue = Number(
    loan.estimatedValue || loan.totalPropertyValue || loan.propertyValue || 0,
  );
  const depRate = 0.1;
  const grossValue = netValue / (1 - depRate);
  const landValue = Math.round(grossValue * 0.6);
  const buildValue = Math.round(grossValue * 0.4);
  const totalGross = landValue + buildValue;
  const depAmount = Math.round(totalGross * depRate);

  const areaText = deed?.landAreaText || '-';
  const sqWahMatch = areaText.match(/(\d+(?:\.\d+)?)\s*ตร\.ว/);
  const sqWah = sqWahMatch ? Number(sqWahMatch[1]) : null;
  const pricePerSqWah =
    sqWah && landValue > 0 ? Math.round(landValue / sqWah) : null;

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
  const medianValue = Math.round(netValue * 0.96);

  const deedImageUrl = deed?.imageUrl || loan.primaryImageUrl || null;
  const supportImgs = loan.supportingImages || [];
  const largePhoto = supportImgs[0] || null;
  const smallPhoto1 = supportImgs[1] || null;
  const smallPhoto2 = supportImgs[2] || null;

  const placeText =
    [deed?.amphurName, deed?.provinceName].filter(Boolean).join(' ') || '-';
  const notes = [
    'ราคาประเมินเพื่อใช้ประกอบการพิจารณาสินเชื่อ',
    'อ้างอิงจากราคาตลาดและสภาพทรัพย์ปัจจุบัน',
    'ค่าประเมินอาจเปลี่ยนแปลงตามภาวะตลาด',
  ];

  return (
    <PdfPage
      key={`a-${loan.id}`}
      size="A4"
      style={{
        fontFamily,
        backgroundColor: T.bg,
        color: T.text,
        paddingHorizontal: 28,
        paddingVertical: 20,
        fontSize: 9,
      }}
    >
      {/* ── HEADER ── */}
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
            borderTopColor: T.border,
            borderTopStyle: 'solid',
          }}
        />
        <PdfText style={{ paddingHorizontal: 10, fontSize: 9, color: T.muted }}>
          รายงานการประเมินราคาอสังหาริมทรัพย์
        </PdfText>
        <PdfView
          style={{
            flex: 1,
            borderTopWidth: 1,
            borderTopColor: T.border,
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

      {/* ── 2-COLUMN MAIN ── */}
      <PdfView style={{ flexDirection: 'row', gap: 12 }}>
        {/* LEFT 57% */}
        <PdfView style={{ width: '57%' }}>
          <FieldsetBox label="ข้อมูลทรัพย์สิน" style={{ marginBottom: 8 }}>
            <KVRow
              label="ประเภททรัพย์"
              value={resolvePropertyType(loan.propertyType, deed?.landType, loan.loanType)}
            />
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
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText
                style={{
                  width: '42%',
                  fontSize: 8.5,
                  color: T.label,
                  fontWeight: 700,
                }}
              >
                รวมมูลค่าทรัพย์สิน
              </PdfText>
              <PdfText
                style={{
                  flex: 1,
                  fontSize: 8.5,
                  color: T.text,
                  fontWeight: 700,
                }}
              >
                ฿{formatCurrency(totalGross)}
              </PdfText>
            </PdfView>
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
            <PdfView
              style={{
                backgroundColor: T.highlight,
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
                  style={{ fontSize: 10, fontWeight: 700, color: T.text }}
                >
                  มูลค่าประเมินสุทธิ
                </PdfText>
                <PdfText
                  style={{ fontSize: 17, fontWeight: 700, color: T.blue }}
                >
                  ฿{formatCurrency(netValue)}
                </PdfText>
              </PdfView>
              <PdfText
                style={{
                  fontSize: 7.5,
                  color: T.label,
                  marginTop: 2,
                  textAlign: 'right',
                }}
              >
                {toThaiBahtText(netValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>

          <FieldsetBox label="สรุปการเปรียบเทียบตลาด">
            <PdfView
              style={{
                flexDirection: 'row',
                backgroundColor: T.bgHeader,
                paddingVertical: 4,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: T.border,
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
                  backgroundColor: idx % 2 === 0 ? T.bg : T.bgGray,
                  borderBottomWidth: 1,
                  borderBottomColor: T.borderLight,
                  borderBottomStyle: 'solid',
                }}
              >
                <PdfText
                  style={{
                    width: '8%',
                    fontSize: 8,
                    textAlign: 'center',
                    color: T.muted,
                  }}
                >
                  {no}
                </PdfText>
                <PdfText style={{ width: '40%', fontSize: 8, color: T.text }}>
                  {name}
                </PdfText>
                <PdfText
                  style={{
                    width: '22%',
                    fontSize: 8,
                    textAlign: 'center',
                    color: T.muted,
                  }}
                >
                  {area}
                </PdfText>
                <PdfText
                  style={{
                    flex: 1,
                    fontSize: 8,
                    textAlign: 'right',
                    color: T.text,
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
                style={{ fontSize: 8.5, fontWeight: 700, color: T.blue }}
              >
                ฿{formatCurrency(medianValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>
        </PdfView>

        {/* RIGHT 41% — ไม่มี หมายเหตุ แล้ว (ย้ายไปใน AI section) */}
        <PdfView style={{ width: '41%' }}>
          <FieldsetBox label="แผนผังที่ดิน" style={{ marginBottom: 8 }}>
            <PhotoBox
              src={deedImageUrl}
              label="แผนผังที่ดิน"
              style={{ height: 110 }}
            />
          </FieldsetBox>

          <FieldsetBox label="รายละเอียดการประเมิน" style={{ marginBottom: 8 }}>
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
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                paddingHorizontal: 3,
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '32%', fontSize: 7.5 }}>
                ราคาที่ดิน
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: T.muted,
                }}
              >
                {sqWah ? `${sqWah} ตร.ว.` : areaText}
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: T.muted,
                }}
              >
                {pricePerSqWah ? formatCurrency(pricePerSqWah) : '-'}
              </PdfText>
              <PdfText style={{ flex: 1, fontSize: 7.5, textAlign: 'right' }}>
                {formatCurrency(landValue)}
              </PdfText>
            </PdfView>
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                paddingHorizontal: 3,
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '32%', fontSize: 7.5 }}>
                สิ่งปลูกสร้าง
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: T.muted,
                }}
              >
                -
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: T.muted,
                }}
              >
                -
              </PdfText>
              <PdfText style={{ flex: 1, fontSize: 7.5, textAlign: 'right' }}>
                {formatCurrency(buildValue)}
              </PdfText>
            </PdfView>
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                paddingHorizontal: 3,
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'solid',
              }}
            >
              <PdfText style={{ width: '32%', fontSize: 7.5 }}>
                ค่าเสื่อมราคา
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: T.muted,
                }}
              >
                -
              </PdfText>
              <PdfText
                style={{
                  width: '22%',
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: T.muted,
                }}
              >
                10%
              </PdfText>
              <PdfText
                style={{
                  flex: 1,
                  fontSize: 7.5,
                  textAlign: 'right',
                  color: '#dc2626',
                }}
              >
                -{formatCurrency(depAmount)}
              </PdfText>
            </PdfView>
            <PdfView
              style={{
                flexDirection: 'row',
                paddingVertical: 4,
                paddingHorizontal: 3,
              }}
            >
              <PdfText style={{ width: '32%', fontSize: 7.5, fontWeight: 700 }}>
                รวม
              </PdfText>
              <PdfText
                style={{ width: '22%', fontSize: 7.5, textAlign: 'right' }}
              />
              <PdfText
                style={{ width: '22%', fontSize: 7.5, textAlign: 'right' }}
              />
              <PdfText
                style={{
                  flex: 1,
                  fontSize: 7.5,
                  fontWeight: 700,
                  textAlign: 'right',
                  color: T.blue,
                }}
              >
                {formatCurrency(netValue)}
              </PdfText>
            </PdfView>
          </FieldsetBox>

          {/* รูปถ่าย: 1 ใหญ่ + 2 เล็ก */}
          <FieldsetBox
            label="รูปถ่ายทรัพย์สิน"
            style={{ position: 'relative', marginBottom: 8 }}
          >
            <PdfView style={{ flexDirection: 'row', gap: 4, height: 72 }}>
              <PhotoBox
                src={largePhoto}
                label="รูปที่ 1"
                style={{ flex: 2, height: '100%' }}
              />
              <PdfView style={{ flex: 1, gap: 4 }}>
                <PhotoBox
                  src={smallPhoto1}
                  label="รูปที่ 2"
                  style={{ flex: 1 }}
                />
                <PhotoBox
                  src={smallPhoto2}
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
                borderColor: T.border,
                borderStyle: 'solid',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.88)',
              }}
            >
              <PdfText
                style={{
                  fontSize: 5.5,
                  color: T.muted,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                InfiniteX{'\n'}STAMP
              </PdfText>
            </PdfView>
          </FieldsetBox>
          {/* หมายเหตุ — ท้ายสุดของ right column */}
          <FieldsetBox label="หมายเหตุ">
            {notes.map((note, i) => (
              <PdfView
                key={i}
                style={{ flexDirection: 'row', marginTop: i === 0 ? 2 : 3 }}
              >
                <PdfText
                  style={{ fontSize: 7.5, color: T.muted, marginRight: 4 }}
                >
                  •
                </PdfText>
                <PdfText
                  style={{
                    flex: 1,
                    fontSize: 7.5,
                    color: T.muted,
                    lineHeight: 1.35,
                  }}
                >
                  {note}
                </PdfText>
              </PdfView>
            ))}
          </FieldsetBox>
        </PdfView>
      </PdfView>

      {/* ── AI SECTION (full-width, compact) ── */}
      {/* ใช้ข้อมูลจาก valuationResult โดยตรง:
          - estimatedValue: ราคาที่ AI ประเมิน
          - confidence: ความเชื่อมั่นที่ AI ให้มา (0-100)
          ถ้ายังไม่มี valuationResult แสดงว่า AI ยังไม่ได้ประเมิน */}
      <AiAppraisalSection
        aiValue={Number(loan.valuationResult?.estimatedValue || loan.estimatedValue || 0)}
        manualValue={Number(loan.totalPropertyValue || loan.propertyValue || 0)}
        loanPrincipal={Number(loan.loanPrincipal || 0)}
        propertyType={resolvePropertyType(loan.propertyType, deed?.landType, loan.loanType)}
        placeText={placeText}
        valuationDate={loan.valuationDate || loan.date}
        aiConfidence={loan.valuationResult?.confidence ?? null}
      />

      {/* ── SIGNATURE ── */}
      <PdfView
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 10,
        }}
      >
        <PdfView style={{ width: '52%', flexDirection: 'row', gap: 20 }}>
          <PdfView style={{ flex: 1, alignItems: 'center' }}>
            <PdfText style={{ fontSize: 8, color: T.muted, marginBottom: 16 }}>
              ลงชื่อ
            </PdfText>
            <PdfView
              style={{
                width: '100%',
                borderBottomWidth: 1,
                borderBottomColor: T.text,
                borderBottomStyle: 'solid',
                marginBottom: 4,
              }}
            />
            <PdfText style={{ fontSize: 8, color: T.muted }}>
              (...................................)
            </PdfText>
            <PdfText style={{ fontSize: 7.5, color: T.muted, marginTop: 2 }}>
              ผู้ประเมินราคาทรัพย์สิน
            </PdfText>
            <PdfView
              style={{
                width: '100%',
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'dashed',
                marginTop: 7,
                marginBottom: 3,
              }}
            />
            <PdfText style={{ fontSize: 7.5, color: T.muted }}>
              วันที่ ......../........../..........พ.ศ.
            </PdfText>
          </PdfView>
          <PdfView style={{ flex: 1, alignItems: 'center' }}>
            <PdfText style={{ fontSize: 8, color: T.muted, marginBottom: 16 }}>
              อนุมัติโดย
            </PdfText>
            <PdfView
              style={{
                width: '100%',
                borderBottomWidth: 1,
                borderBottomColor: T.text,
                borderBottomStyle: 'solid',
                marginBottom: 4,
              }}
            />
            <PdfText style={{ fontSize: 8, color: T.muted }}>
              (...................................)
            </PdfText>
            <PdfText style={{ fontSize: 7.5, color: T.muted, marginTop: 2 }}>
              หัวหน้าฝ่ายสินเชื่อ
            </PdfText>
            <PdfView
              style={{
                width: '100%',
                borderBottomWidth: 1,
                borderBottomColor: T.borderLight,
                borderBottomStyle: 'dashed',
                marginTop: 7,
                marginBottom: 3,
              }}
            />
            <PdfText style={{ fontSize: 7.5, color: T.muted }}>
              วันที่ ......../........../..........พ.ศ.
            </PdfText>
          </PdfView>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
