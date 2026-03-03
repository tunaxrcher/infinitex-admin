import { Page as PdfPage, Text as PdfText, View as PdfView } from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  pdfStyles,
  TaxFeeLoanItem,
} from './shared';

export function CloseCasePage({
  loan,
  fontFamily,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
}) {
  const primaryDeed =
    loan.titleDeeds?.find((deed) => deed.isPrimary) || loan.titleDeeds?.[0];
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

  const statusText =
    loan.loanStatus === 'ACTIVE'
      ? 'ยังไม่ถึงกำหนด'
      : loan.loanStatus === 'COMPLETED'
        ? 'ปิดบัญชี'
        : loan.loanStatus === 'DEFAULTED'
          ? 'เกินกำหนดชำระ'
          : 'รออนุมัติ';
  const currentInstallment = Number(loan.currentInstallment || 0);
  const totalInstallments = Number(loan.totalInstallments || 0);
  const installmentText =
    totalInstallments > 0 ? `${currentInstallment}/${totalInstallments}` : '-';
  const durationText =
    loan.termMonths && loan.termMonths > 0
      ? `${(loan.termMonths / 12).toFixed(1)} ปี (${loan.termMonths} งวด)`
      : '-';
  const totalPropertyValue = Number(loan.totalPropertyValue || loan.propertyValue || 0);
  const requestedAmount = Number(loan.requestedAmount || 0);
  const approvedAmount = Number(loan.approvedAmount || 0);
  const maxApprovedAmount = Number(loan.maxApprovedAmount || 0);

  return (
    <PdfPage
      key={`c-${loan.id}`}
      size="A4"
      style={[
        pdfStyles.page,
        { fontFamily, backgroundColor: '#070910', color: '#e5e7eb', paddingTop: 14 },
      ]}
    >
      <PdfView
        style={{
          borderWidth: 1,
          borderColor: '#1f2430',
          borderStyle: 'solid',
          borderRadius: 6,
          padding: 10,
          backgroundColor: '#0b0f17',
        }}
      >
        <PdfView style={{ ...pdfStyles.rowBetween }}>
          <PdfText style={{ color: '#58a6ff', fontSize: 14, fontWeight: 700 }}>
            รายละเอียดและวิเคราะห์สินเชื่อ
          </PdfText>
          <PdfText style={{ color: '#6b7280' }}>x</PdfText>
        </PdfView>

        <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 10 }}>
          <PdfView>
            <PdfText style={{ fontSize: 18, fontWeight: 700 }}>
              {loan.customerName || '-'}
            </PdfText>
            <PdfText style={{ marginTop: 4, color: '#a1a1aa', fontSize: 10 }}>
              เลขที่สินเชื่อ {loan.loanNumber || '-'} • วันที่ปิดเคส{' '}
              {formatDateOrDash(loan.date)}
            </PdfText>
          </PdfView>
          <PdfView
            style={{
              backgroundColor: '#5b21b6',
              borderRadius: 12,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <PdfText style={{ fontSize: 9, color: '#ffffff', fontWeight: 700 }}>
              ปิดบัญชี
            </PdfText>
          </PdfView>
        </PdfView>

        <PdfView
          style={{
            marginTop: 10,
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#1f2430',
            borderBottomStyle: 'solid',
            paddingBottom: 8,
          }}
        >
          {[
            'รายละเอียดสินเชื่อ',
            'ชำระสินเชื่อ',
            'ประเมินมูลค่าทรัพย์สิน',
            'หนังสือสัญญากู้เงิน',
            'ตารางผ่อนชำระ',
            'ยกเลิกสินเชื่อ',
          ].map((tab, idx) => (
            <PdfText
              key={tab}
              style={{
                fontSize: 9.5,
                color: idx === 0 ? '#58a6ff' : '#9ca3af',
                fontWeight: idx === 0 ? 700 : 500,
                marginRight: 14,
              }}
            >
              {tab}
            </PdfText>
          ))}
        </PdfView>

        <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 10 }}>
          <PdfView style={{ width: '59%' }}>
            <PdfView
              style={{
                borderWidth: 1,
                borderColor: '#202637',
                borderStyle: 'solid',
                borderRadius: 6,
                backgroundColor: '#0c1019',
              }}
            >
              <PdfView
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: '#202637',
                  borderBottomStyle: 'solid',
                  padding: 8,
                }}
              >
                <PdfText style={{ fontSize: 11, fontWeight: 700 }}>สรุปสินเชื่อ</PdfText>
              </PdfView>
              <PdfView style={{ ...pdfStyles.rowBetween, padding: 8 }}>
                <PdfView style={{ width: '24%' }}>
                  <PdfText style={{ color: '#9ca3af', fontSize: 9 }}>สถานะ</PdfText>
                  <PdfText style={{ marginTop: 3, fontWeight: 700, fontSize: 10 }}>
                    {statusText}
                  </PdfText>
                </PdfView>
                <PdfView style={{ width: '24%' }}>
                  <PdfText style={{ color: '#9ca3af', fontSize: 9 }}>วงเงิน</PdfText>
                  <PdfText style={{ marginTop: 3, fontWeight: 700, fontSize: 10 }}>
                    ฿{formatCurrency(loan.loanPrincipal || 0)}
                  </PdfText>
                </PdfView>
                <PdfView style={{ width: '24%' }}>
                  <PdfText style={{ color: '#9ca3af', fontSize: 9 }}>ดอกเบี้ย</PdfText>
                  <PdfText style={{ marginTop: 3, fontWeight: 700, fontSize: 10 }}>
                    {formatCurrency(loan.interestRate || 0)}%
                  </PdfText>
                </PdfView>
                <PdfView style={{ width: '24%' }}>
                  <PdfText style={{ color: '#9ca3af', fontSize: 9 }}>งวดที่ชำระ</PdfText>
                  <PdfText style={{ marginTop: 3, fontWeight: 700, fontSize: 10 }}>
                    {installmentText}
                  </PdfText>
                </PdfView>
              </PdfView>
            </PdfView>

            <PdfText style={{ marginTop: 10, fontSize: 11, fontWeight: 700 }}>
              Core Financial Ratios
            </PdfText>
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                { t: 'ROI', v: `${formatCurrency(loan.interestRate || 0)}%`, c: '#4c1d95' },
                {
                  t: 'LTV',
                  v:
                    totalPropertyValue > 0
                      ? `${((loan.loanPrincipal / totalPropertyValue) * 100).toFixed(1)}%`
                      : '-',
                  c: '#064e3b',
                },
                { t: 'P/Loan', v: `${(loan.loanPrincipal / 240000).toFixed(2)}x`, c: '#1e3a8a' },
                { t: 'YTD (Realized)', v: `${formatCurrency(loan.feeAmount)}%`, c: '#581c87' },
                { t: 'YTD (Planned)', v: `${formatCurrency(loan.feeAmount)}%`, c: '#1e3a8a' },
                { t: 'YTD Gap', v: '0.0% lead', c: '#78350f' },
              ].map((m) => (
                <PdfView
                  key={m.t}
                  style={{
                    width: '32.2%',
                    borderWidth: 1,
                    borderColor: '#202637',
                    borderStyle: 'solid',
                    borderRadius: 6,
                    backgroundColor: m.c,
                    padding: 7,
                    marginBottom: 6,
                  }}
                >
                  <PdfText style={{ fontSize: 8.5, color: '#cbd5e1' }}>{m.t}</PdfText>
                  <PdfText
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {m.v}
                  </PdfText>
                </PdfView>
              ))}
            </PdfView>
          </PdfView>

          <PdfView style={{ width: '39%' }}>
            <PdfView
              style={{
                height: 200,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#202637',
                borderStyle: 'solid',
                overflow: 'hidden',
              }}
            >
              <PdfView
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#111827',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <PdfText style={{ color: '#9ca3af' }}>หลักประกัน</PdfText>
              </PdfView>
            </PdfView>
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 6, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <PdfView
                  key={n}
                  style={{
                    width: '18.5%',
                    height: 38,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: '#334155',
                    borderStyle: 'solid',
                    backgroundColor: '#111827',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <PdfText style={{ fontSize: 8, color: '#9ca3af' }}>{n}</PdfText>
                </PdfView>
              ))}
            </PdfView>

            <PdfText style={{ marginTop: 8, fontSize: 9, color: '#9ca3af', lineHeight: 1.25 }}>
              รายละเอียด (In development): Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Hic dolorum voluptatum temporibus officia.
            </PdfText>

            <PdfView
              style={{
                marginTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#1f2430',
                borderTopStyle: 'solid',
                paddingTop: 8,
              }}
            >
              {[
                ['ประเภทสินเชื่อ', 'จำนองบ้านและที่ดิน'],
                ['วงเงินบ้านและที่ดิน', durationText],
                ['อัตราดอกเบี้ย', `${formatCurrency(loan.interestRate || 0)}% ต่อปี`],
                ['ความเสี่ยง', 'ความเสี่ยงปานกลาง'],
                ['สถานที่', productListPlaceDisplay || '-'],
                [
                  'วงเงินที่ขอ',
                  requestedAmount > 0 ? `฿${formatCurrency(requestedAmount)}` : '-',
                ],
                [
                  'วงเงินอนุมัติ',
                  approvedAmount > 0 ? `฿${formatCurrency(approvedAmount)}` : '-',
                ],
                [
                  'วงเงินสูงสุด',
                  maxApprovedAmount > 0 ? `฿${formatCurrency(maxApprovedAmount)}` : '-',
                ],
              ].map(([k, v]) => (
                <PdfView
                  key={k}
                  style={{ ...pdfStyles.rowBetween, marginBottom: 4, alignItems: 'center' }}
                >
                  <PdfText style={{ width: '38%', color: '#a1a1aa', fontSize: 9 }}>{k}</PdfText>
                  <PdfText style={{ width: '60%', fontSize: 9.5, fontWeight: 700 }}>{v}</PdfText>
                </PdfView>
              ))}
            </PdfView>
          </PdfView>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
