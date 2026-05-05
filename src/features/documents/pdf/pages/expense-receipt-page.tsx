import {
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  COMPANY,
  formatCurrency,
  formatDateOrDash,
  pdfStyles,
  toThaiBahtText,
  wrapDocCode,
  type ExpenseItem,
} from '../shared';
import { CompanyHeader, RegistrationInfo } from '../shared/components';

export function ExpenseReceiptPage({
  expense,
  fontFamily,
  logoSrc,
}: {
  expense: ExpenseItem;
  fontFamily: string;
  logoSrc?: string | null;
}) {
  const subtotal = Number(expense.amount || 0);
  // const vat = subtotal * 0.07;

  // Withholding tax calculation
  // 1) New records: use withholdingTax flag + withholdingTaxRate from DB
  // 2) Old commission records without flag: fallback to 3%
  const isCommission = (expense.title || '').toLowerCase().includes('คอมมิชชั่น') || (expense.title || '').toLowerCase().includes('commission');
  const isOldCommissionWithoutFlag = isCommission && !expense.withholdingTax;
  const shouldApplyWithholdingTax = expense.withholdingTax || isOldCommissionWithoutFlag;
  const withholdingTaxRate = expense.withholdingTax
    ? Number(expense.withholdingTaxRate || 3)
    : (isOldCommissionWithoutFlag ? 3 : 0);
  const withholdingTaxAmount = shouldApplyWithholdingTax
    ? subtotal * (withholdingTaxRate / 100)
    : 0;
  const grand = subtotal - withholdingTaxAmount;

  // Signature colors
  const C = {
    text: '#111827',
    muted: '#6b7280',
    borderLight: '#e5e7eb',
  };

  return (
    <PdfPage
      key={`exp-${expense.id}`}
      size="A4"
      style={[pdfStyles.page, { fontFamily }]}
    >
      <CompanyHeader logoSrc={logoSrc} />

      <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 20 }}>
        <PdfView>
          <PdfText style={pdfStyles.receiptTitleTh}>ใบสำคัญจ่าย</PdfText>
          <PdfText style={pdfStyles.receiptTitleEn}>Payment Voucher</PdfText>
        </PdfView>
        <PdfView style={{ width: '44%' }}>
          <RegistrationInfo />
        </PdfView>
      </PdfView>

      <PdfView
        style={{
          ...pdfStyles.rowBetween,
          marginTop: 18,
          alignItems: 'stretch',
        }}
      >
        <PdfView style={{ ...pdfStyles.box, width: '39%', minHeight: 110 }}>
          <PdfText style={{ fontSize: 16, fontWeight: 700 }}>
            {COMPANY.name}
          </PdfText>
          <PdfText style={{ marginTop: 10, fontSize: 12 }}>
            {COMPANY.addressFull}
          </PdfText>
          <PdfText style={{ marginTop: 12, fontSize: 10 }}>
            เลขประจำตัวผู้เสียภาษี / TAX ID. {COMPANY.taxId}
          </PdfText>
        </PdfView>

        <PdfView style={{ width: '59%', minHeight: 110 }}>
          <PdfView style={pdfStyles.rowBetween}>
            <PdfView
              style={{
                ...pdfStyles.box,
                width: '49%',
                padding: 0,
                minHeight: 52,
                maxHeight: 52,
              }}
            >
              <PdfView
                style={{
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  height: '100%',
                }}
              >
                <PdfView
                  style={{
                    width: '48%',
                    backgroundColor: '#f3f4f6',
                    justifyContent: 'flex-start',
                    paddingHorizontal: 7,
                    paddingTop: 7,
                    borderRightWidth: 1,
                    borderRightColor: '#d1d5db',
                    borderRightStyle: 'solid',
                  }}
                >
                  <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>
                    เลขที่ใบสำคัญ
                  </PdfText>
                  <PdfText
                    style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}
                  >
                    Voucher No.
                  </PdfText>
                </PdfView>
                <PdfView
                  style={{
                    width: '52%',
                    justifyContent: 'flex-start',
                    paddingHorizontal: 6,
                    paddingTop: 7,
                  }}
                >
                  <PdfText
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      textAlign: 'right',
                      lineHeight: 1.1,
                    }}
                  >
                    {wrapDocCode(expense.docNumber)}
                  </PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
            <PdfView
              style={{
                ...pdfStyles.box,
                width: '49%',
                padding: 0,
                minHeight: 52,
                maxHeight: 52,
              }}
            >
              <PdfView
                style={{
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  height: '100%',
                }}
              >
                <PdfView
                  style={{
                    width: '48%',
                    backgroundColor: '#f3f4f6',
                    justifyContent: 'flex-start',
                    paddingHorizontal: 7,
                    paddingTop: 7,
                    borderRightWidth: 1,
                    borderRightColor: '#d1d5db',
                    borderRightStyle: 'solid',
                  }}
                >
                  <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>
                    วันที่
                  </PdfText>
                  <PdfText
                    style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}
                  >
                    Date
                  </PdfText>
                </PdfView>
                <PdfView
                  style={{
                    width: '52%',
                    justifyContent: 'flex-start',
                    paddingHorizontal: 6,
                    paddingTop: 7,
                  }}
                >
                  <PdfText style={{ fontSize: 9.5, textAlign: 'right' }}>
                    {formatDateOrDash(expense.date)}
                  </PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
          </PdfView>

        </PdfView>
      </PdfView>

      {/* Payee box — below company box, shown when withholding tax applies */}
      {shouldApplyWithholdingTax && (
        <PdfView style={{ ...pdfStyles.box, marginTop: 8, width: '39%' }}>
          <PdfText style={{ fontSize: 9, color: '#6b7280', marginBottom: 3 }}>
            ผู้รับเงิน / Payee
          </PdfText>
          <PdfText style={{ fontSize: 12, fontWeight: 700 }}>
            {expense.withholdingTaxRecipient || '-'}
          </PdfText>
          {expense.withholdingTaxAddress && (
            <PdfText style={{ marginTop: 4, fontSize: 10 }}>
              {expense.withholdingTaxAddress}
            </PdfText>
          )}
        </PdfView>
      )}

      <PdfText style={pdfStyles.tableBlueTitle}>รายการ / List</PdfText>
      <PdfView
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopColor: '#111827',
          borderBottomColor: '#111827',
          borderTopStyle: 'solid',
          borderBottomStyle: 'solid',
          paddingVertical: 8,
        }}
      >
        <PdfText
          style={{
            width: '40%',
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          ชื่อรายการ{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Item name</PdfText>
        </PdfText>
        <PdfText
          style={{
            width: '40%',
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          รายละเอียด{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Details</PdfText>
        </PdfText>
        <PdfText
          style={{
            width: '20%',
            fontSize: 11,
            textAlign: 'right',
            lineHeight: 1.25,
          }}
        >
          จำนวนเงิน{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Amount</PdfText>
        </PdfText>
      </PdfView>
      <PdfView style={{ flexDirection: 'row', paddingVertical: 8 }}>
        <PdfText style={{ width: '40%', fontSize: 12 }}>
          {expense.title || '-'}
        </PdfText>
        <PdfText style={{ width: '40%', fontSize: 12 }}>
          {expense.note || '-'}
        </PdfText>
        <PdfText style={{ width: '20%', fontSize: 12, textAlign: 'right' }}>
          {formatCurrency(subtotal)}
        </PdfText>
      </PdfView>
      <PdfView
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#111827',
          borderBottomStyle: 'solid',
          paddingBottom: 6,
        }}
      >
        {/* <PdfText style={{ textAlign: 'right', fontSize: 12 }}>
          รวมรายจ่ายทั้งสิ้น {formatCurrency(subtotal)} บาท
        </PdfText> */}
      </PdfView>

      <PdfView
        style={{
          ...pdfStyles.rowBetween,
          marginTop: 14,
          alignItems: 'flex-end',
        }}
      >
        <PdfText style={{ width: '55%', fontSize: 12 }}>
          {toThaiBahtText(grand)}
        </PdfText>
        <PdfView style={{ width: '43%' }}>
          {shouldApplyWithholdingTax && (
            <>
              <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                <PdfText>ยอดรวมก่อนหักภาษี (Subtotal)</PdfText>
                <PdfText>{formatCurrency(subtotal)}</PdfText>
              </PdfView>
              <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                <PdfText>หัก ณ ที่จ่าย {withholdingTaxRate}%</PdfText>
                <PdfText>-{formatCurrency(withholdingTaxAmount)}</PdfText>
              </PdfView>
            </>
          )}
          <PdfView
            style={{
              ...pdfStyles.rowBetween,
              paddingTop: 4,
            }}
          >
            <PdfText style={{ fontWeight: 700 }}>จำนวนเงินรวมทั้งสิ้น</PdfText>
            <PdfText style={{ fontWeight: 700 }}>
              {formatCurrency(grand)}
            </PdfText>
          </PdfView>
        </PdfView>
      </PdfView>

      <PdfText
        style={{
          marginTop: 20,
          color: '#1d4ed8',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        หมายเหตุ
      </PdfText>
      <PdfText style={{ marginTop: 6, color: '#6b7280' }}>-</PdfText>

      {/* Approver & Recipient Signature Section */}
      <PdfView
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 30,
        }}
      >
        <PdfView style={{ width: '52%', flexDirection: 'row', gap: 20 }}>
          {[
            { title: 'อนุมัติโดย', role: 'ผู้อนุมัติ' },
            { title: 'ลงชื่อ', role: 'ผู้รับเงิน' },
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
