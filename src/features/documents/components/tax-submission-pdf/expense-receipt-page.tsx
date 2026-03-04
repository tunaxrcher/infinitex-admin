import {
  Image as PdfImage,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  type ExpenseItem,
  pdfStyles,
  toThaiBahtText,
  wrapDocCode,
} from './shared';

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
  const vat = subtotal * 0.07;
  const grand = subtotal + vat;

  return (
    <PdfPage
      key={`exp-${expense.id}`}
      size="A4"
      style={[pdfStyles.page, { fontFamily }]}
    >
      <PdfView style={pdfStyles.rowBetween}>
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

      <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 20 }}>
        <PdfView>
          <PdfText style={pdfStyles.receiptTitleTh}>ใบสำคัญจ่าย</PdfText>
          <PdfText style={pdfStyles.receiptTitleEn}>Payment Voucher</PdfText>
        </PdfView>
        <PdfView style={{ width: '44%' }}>
          <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
            ทะเบียนเลขที่ / Registration No. 0345568003383
          </PdfText>
          <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
            เลขประจำตัวผู้เสียภาษี / Tax ID. 0345568003383
          </PdfText>
          <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
            เลขที่สาขา 00000
          </PdfText>
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
            บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด
          </PdfText>
          <PdfText style={{ marginTop: 10, fontSize: 12 }}>
            11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
          </PdfText>
          <PdfText style={{ marginTop: 12, fontSize: 10 }}>
            เลขประจำตัวผู้เสียภาษี / TAX ID. 0345568003383
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
            width: '30%',
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          หมวดหมู่{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Category</PdfText>
        </PdfText>
        <PdfText
          style={{
            width: '30%',
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          บัญชี{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Account</PdfText>
        </PdfText>
        <PdfText
          style={{
            width: '20%',
            fontSize: 11,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          หมายเหตุ{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Note</PdfText>
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
        <PdfText style={{ width: '30%', fontSize: 12 }}>
          {expense.title || '-'}
        </PdfText>
        <PdfText style={{ width: '30%', fontSize: 12 }}>
          {expense.cashFlowName || '-'}
        </PdfText>
        <PdfText style={{ width: '20%', fontSize: 12 }}>
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
        <PdfText style={{ textAlign: 'right', fontSize: 12 }}>
          รวมรายจ่ายทั้งสิ้น {formatCurrency(subtotal)} บาท
        </PdfText>
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
          <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
            <PdfText>ยอดรวมก่อนภาษี (Subtotal)</PdfText>
            <PdfText>{formatCurrency(subtotal)}</PdfText>
          </PdfView>
          <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
            <PdfText>ภาษีมูลค่าเพิ่ม 7% (VAT 7%)</PdfText>
            <PdfText>{formatCurrency(vat)}</PdfText>
          </PdfView>
          <PdfView
            style={{
              ...pdfStyles.rowBetween,
              borderTopWidth: 1,
              borderTopColor: '#111827',
              borderTopStyle: 'solid',
              paddingTop: 4,
            }}
          >
            <PdfText style={{ fontWeight: 700 }}>
              ยอดรวมทั้งสิ้น (Grand Total)
            </PdfText>
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
      <PdfText style={{ marginTop: 6, color: '#6b7280' }}>
        {expense.note || '-'}
      </PdfText>
    </PdfPage>
  );
}
