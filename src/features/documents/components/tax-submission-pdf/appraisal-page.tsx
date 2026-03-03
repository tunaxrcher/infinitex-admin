import {
  Page as PdfPage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import {
  formatCurrency,
  formatDateOrDash,
  pdfStyles,
  TaxFeeLoanItem,
} from './shared';

export function AppraisalPage({
  loan,
  fontFamily,
}: {
  loan: TaxFeeLoanItem;
  fontFamily: string;
}) {
  const primaryDeed =
    loan.titleDeeds?.find((deed) => deed.isPrimary) || loan.titleDeeds?.[0];
  const titleDeed = primaryDeed;
  const netValue = Number(loan.estimatedValue || loan.propertyValue || 0);
  const compareRows = [
    ['1', 'บ้านทาวน์เฮ้าส์ใกล้เคียง', netValue * 0.98],
    ['2', 'ตลบใกล้เคียงทาง', netValue * 1.01],
    ['3', 'ท้องแปลงใกล้เคียง', netValue * 0.95],
  ];

  return (
    <PdfPage
      key={`a-${loan.id}`}
      size="A4"
      style={[pdfStyles.page, { fontFamily }]}
    >
      <PdfText style={{ fontSize: 40, fontWeight: 700, textAlign: 'center' }}>
        ใบประเมินมูลค่าทรัพย์สิน
      </PdfText>
      <PdfView
        style={{ ...pdfStyles.rowBetween, alignItems: 'center', marginTop: 4 }}
      >
        <PdfView
          style={{
            width: '28%',
            borderTopWidth: 1,
            borderTopColor: '#9ca3af',
            borderTopStyle: 'solid',
          }}
        />
        <PdfText style={{ width: '44%', textAlign: 'center', fontSize: 14 }}>
          รายงานการประเมินราคาอสังหาริมทรัพย์
        </PdfText>
        <PdfView
          style={{
            width: '28%',
            borderTopWidth: 1,
            borderTopColor: '#9ca3af',
            borderTopStyle: 'solid',
          }}
        />
      </PdfView>
      <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 10 }}>
        <PdfView>
          <PdfText style={{ fontWeight: 700 }}>
            หลักทรัพย์ : {loan.loanNumber || '-'}
          </PdfText>
          <PdfText style={{ marginTop: 2 }}>คำรับ : วางหลักทรัพย์จำนอง</PdfText>
        </PdfView>
        <PdfView style={pdfStyles.textRight}>
          <PdfText style={{ fontWeight: 700 }}>
            วันที่ประเมิน : {formatDateOrDash(loan.valuationDate || loan.date)}
          </PdfText>
          <PdfText style={{ marginTop: 2 }}>
            เลขที่รายงาน : AV-REP-{loan.loanNumber || '-'}
          </PdfText>
        </PdfView>
      </PdfView>

      <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
        <PdfView style={{ width: '59%' }}>
          <PdfView style={pdfStyles.box}>
            <PdfText
              style={{
                marginTop: -16,
                backgroundColor: '#fff',
                width: 120,
                textAlign: 'center',
                fontWeight: 700,
                marginLeft: 10,
              }}
            >
              ข้อมูลทรัพย์สิน
            </PdfText>
            <PdfView style={{ marginTop: 4 }}>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>ประเภททรัพย์</PdfText>
                <PdfText>
                  {titleDeed?.landType || 'ที่ดินพร้อมสิ่งปลูกสร้าง'}
                </PdfText>
              </PdfView>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>เนื้อที่ดิน</PdfText>
                <PdfText>{titleDeed?.landAreaText || '-'}</PdfText>
              </PdfView>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>ที่ตั้ง</PdfText>
                <PdfText>
                  {titleDeed?.amphurName || '-'} /{' '}
                  {titleDeed?.provinceName || '-'}
                </PdfText>
              </PdfView>
              <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                <PdfText>ผู้ถือกรรมสิทธิ์</PdfText>
                <PdfText>
                  {titleDeed?.ownerName || loan.ownerName || '-'}
                </PdfText>
              </PdfView>
            </PdfView>
          </PdfView>

          <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
            <PdfText
              style={{
                marginTop: -16,
                backgroundColor: '#fff',
                width: 130,
                textAlign: 'center',
                fontWeight: 700,
                marginLeft: 10,
              }}
            >
              ผลการประเมินมูลค่า
            </PdfText>
            <PdfView style={{ marginTop: 6 }}>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>มูลค่าต้น</PdfText>
                <PdfText>{formatCurrency(loan.propertyValue || 0)}</PdfText>
              </PdfView>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>มูลค่าปรับอุปสงค์</PdfText>
                <PdfText>
                  {formatCurrency((loan.propertyValue || 0) * 0.92)}
                </PdfText>
              </PdfView>
              <PdfView
                style={{ backgroundColor: '#f3f4f6', padding: 8, marginTop: 6 }}
              >
                <PdfView style={pdfStyles.rowBetween}>
                  <PdfText style={{ fontSize: 19, fontWeight: 700 }}>
                    มูลค่าประเมินสุทธิ
                  </PdfText>
                  <PdfText style={{ fontSize: 28, fontWeight: 700 }}>
                    {formatCurrency(netValue)}
                  </PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
          </PdfView>

          <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
            <PdfText
              style={{
                marginTop: -16,
                backgroundColor: '#fff',
                width: 170,
                textAlign: 'center',
                fontWeight: 700,
                marginLeft: 10,
              }}
            >
              สรุปการเปรียบเทียบตลาด
            </PdfText>
            <PdfView style={{ marginTop: 6 }}>
              <PdfView
                style={{
                  flexDirection: 'row',
                  backgroundColor: '#f1f5f9',
                  paddingVertical: 5,
                }}
              >
                <PdfText
                  style={{ width: '12%', textAlign: 'center', fontWeight: 700 }}
                >
                  ลำดับ
                </PdfText>
                <PdfText style={{ width: '58%', fontWeight: 700 }}>
                  ทรัพย์จดเทียบเคียง
                </PdfText>
                <PdfText
                  style={{ width: '30%', textAlign: 'right', fontWeight: 700 }}
                >
                  ราคาขาย
                </PdfText>
              </PdfView>
              {compareRows.map((r, idx) => (
                <PdfView
                  key={r[0]}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 5,
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                  }}
                >
                  <PdfText style={{ width: '12%', textAlign: 'center' }}>
                    {r[0]}
                  </PdfText>
                  <PdfText style={{ width: '58%' }}>{r[1]}</PdfText>
                  <PdfText style={{ width: '30%', textAlign: 'right' }}>
                    {formatCurrency(Number(r[2]))}
                  </PdfText>
                </PdfView>
              ))}
              <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 4 }}>
                <PdfText style={{ fontWeight: 700 }}>ค่ายสื่อกลาง</PdfText>
                <PdfText style={{ fontWeight: 700 }}>
                  {formatCurrency(netValue * 0.96)}
                </PdfText>
              </PdfView>
            </PdfView>
          </PdfView>
        </PdfView>

        <PdfView style={{ width: '39%' }}>
          <PdfView
            style={{
              ...pdfStyles.box,
              height: 190,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <PdfText style={{ color: '#6b7280' }}>
              แผนผังที่ดิน (Placeholder)
            </PdfText>
          </PdfView>

          <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
            <PdfText
              style={{
                marginTop: -16,
                backgroundColor: '#fff',
                width: 130,
                textAlign: 'center',
                fontWeight: 700,
                marginLeft: 10,
              }}
            >
              รายละเอียดการประเมิน
            </PdfText>
            <PdfView style={{ marginTop: 6 }}>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>ราคาที่ดิน</PdfText>
                <PdfText>
                  {formatCurrency((loan.propertyValue || 0) * 0.55)}
                </PdfText>
              </PdfView>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>สิ่งปลูกสร้าง</PdfText>
                <PdfText>
                  {formatCurrency((loan.propertyValue || 0) * 0.4)}
                </PdfText>
              </PdfView>
              <PdfView style={pdfStyles.kvRow}>
                <PdfText>ค่าเสื่อม/ปรับปรุง</PdfText>
                <PdfText>
                  -{formatCurrency((loan.propertyValue || 0) * 0.03)}
                </PdfText>
              </PdfView>
              <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                <PdfText style={{ fontWeight: 700 }}>รวม</PdfText>
                <PdfText style={{ fontWeight: 700 }}>
                  {formatCurrency(netValue)}
                </PdfText>
              </PdfView>
            </PdfView>
          </PdfView>

          <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
            <PdfText
              style={{
                marginTop: -16,
                backgroundColor: '#fff',
                width: 80,
                textAlign: 'center',
                fontWeight: 700,
                marginLeft: 10,
              }}
            >
              กฎ.หมายเหตุ
            </PdfText>
            <PdfText style={{ marginTop: 6, fontSize: 11 }}>
              • ราคาประเมินเพื่อใช้ประกอบการพิจารณาสินเชื่อ
            </PdfText>
            <PdfText style={{ marginTop: 4, fontSize: 11 }}>
              • อ้างอิงจากราคาตลาดและสภาพทรัพย์ปัจจุบัน
            </PdfText>
            <PdfText style={{ marginTop: 4, fontSize: 11 }}>
              • ค่าประเมินอาจเปลี่ยนแปลงตามภาวะตลาด
            </PdfText>
          </PdfView>

          <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
            {[1, 2, 3, 4].map((n) => (
              <PdfView
                key={n}
                style={{
                  width: '48%',
                  height: 70,
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderStyle: 'solid',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <PdfText style={{ fontSize: 10, color: '#6b7280' }}>
                  รูปทรัพย์ {n}
                </PdfText>
              </PdfView>
            ))}
          </PdfView>
        </PdfView>
      </PdfView>

      <PdfView style={{ marginTop: 20, alignItems: 'flex-end' }}>
        <PdfView
          style={{
            width: 280,
            borderBottomWidth: 1,
            borderBottomColor: '#6b7280',
            borderBottomStyle: 'dashed',
            paddingBottom: 18,
          }}
        >
          <PdfText style={{ textAlign: 'center', color: '#6b7280' }}>
            วันที่ ......... เดือน ......... พ.ศ. .........
          </PdfText>
        </PdfView>
      </PdfView>
    </PdfPage>
  );
}
