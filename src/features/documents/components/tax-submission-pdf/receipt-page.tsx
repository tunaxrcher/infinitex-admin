import {
  Image as PdfImage,
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  pdfStyles,
  resolvePropertyType,
  TaxFeeLoanItem,
  toThaiBahtText,
  wrapDocCode,
} from './shared';

export function ReceiptPage({
  loan,
  fontFamily,
  logoSrc,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
  logoSrc?: string | null;
}) {
  const subtotal = Number(loan.feeAmount || 0);
  const vat = subtotal * 0.07;
  const grand = subtotal + vat;
  const primaryDeed =
    loan.titleDeeds?.find((deed) => deed.isPrimary) || loan.titleDeeds?.[0];
  const titleDeed = primaryDeed;
  const propertyType = resolvePropertyType(
    loan.propertyType,
    primaryDeed?.landType,
    loan.loanType,
  );
  const normalizedAllPlaceNames = (loan.allPlaceNames || [])
    .map((name) =>
      String(name || '')
        .trim()
        .replace(/\s+/g, ' '),
    )
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
  const propertyLocation =
    productListPlaceDisplay && productListPlaceDisplay !== '-'
      ? productListPlaceDisplay
      : '';
  const displayType = propertyType;
  const receiptItemName = [displayType, propertyLocation]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <PdfPage
      key={`r-${loan.id}`}
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
          <PdfText style={pdfStyles.receiptTitleTh}>ใบเสร็จรับเงิน</PdfText>
          <PdfText style={pdfStyles.receiptTitleEn}>Receipt</PdfText>
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
            {loan.customerName || '-'}
          </PdfText>
          <PdfText style={{ marginTop: 10, fontSize: 12 }}>
            {loan.customerAddress || '-'}
          </PdfText>
          <PdfText style={{ marginTop: 12, fontSize: 10 }}>
            เลขประจำตัวผู้เสียภาษี / TAX ID. {loan.customerTaxId || '-'}
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
                    เลขที่
                  </PdfText>
                  <PdfText
                    style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}
                  >
                    No.
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
                    }}
                  >
                    {loan.loanNumber || '-'}
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
                    เลขที่ใบเสร็จ
                  </PdfText>
                  <PdfText
                    style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}
                  >
                    Receipt No.
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
                    {wrapDocCode(loan.paymentRef)}
                  </PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
          </PdfView>
          <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 6 }}>
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
                    เลขที่ทำรายการ
                  </PdfText>
                  <PdfText
                    style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}
                  >
                    Transaction No.
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
                      textAlign: 'right',
                      lineHeight: 1.1,
                    }}
                  >
                    {wrapDocCode(loan.transactionId || loan.id || '-')}
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
                    วันออกใบเสร็จ
                  </PdfText>
                  <PdfText
                    style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}
                  >
                    Receipt Date
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
                    {formatDateOrDash(loan.date)}
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
          ค่าธรรมเนียม{'\n'}
          <PdfText style={{ fontSize: 9, color: '#6b7280' }}>Fee</PdfText>
        </PdfText>
      </PdfView>
      <PdfView style={{ flexDirection: 'row', paddingVertical: 8 }}>
        <PdfText style={{ width: '40%', fontSize: 12 }}>
          {receiptItemName}
        </PdfText>
        <PdfText style={{ width: '40%', fontSize: 12 }}>
          - ค่าธรรมเนียมบริการ{'\n'}- ค่าดำเนินการ โอน-ไถ่ถอน
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
          ค่าธรรมเนียมรวมทั้งสิ้น {formatCurrency(subtotal)} บาท
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
      <PdfText style={{ marginTop: 6, color: '#6b7280' }}>-</PdfText>
    </PdfPage>
  );
}
