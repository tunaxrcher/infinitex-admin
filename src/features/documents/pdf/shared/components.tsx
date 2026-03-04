import {
  Image as PdfImage,
  Text as PdfText,
  View as PdfView,
} from '@react-pdf/renderer';
import { COMPANY } from './constants';
import { pdfStyles } from './styles';

/**
 * Company header (logo + company name + address)
 * ใช้ร่วมกันทุก PDF page
 */
export function CompanyHeader({
  logoSrc,
  marginBottom = 10,
}: {
  logoSrc?: string | null;
  marginBottom?: number;
}) {
  return (
    <PdfView
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom,
      }}
    >
      <PdfView style={{ width: '35%' }}>
        {logoSrc && (
          <PdfImage
            src={logoSrc}
            style={{ width: 140, height: 48, objectFit: 'contain' }}
          />
        )}
      </PdfView>
      <PdfView style={{ width: '63%' }}>
        <PdfText style={{ fontSize: 26, fontWeight: 700, textAlign: 'right' }}>
          {COMPANY.name}
        </PdfText>
        <PdfText
          style={{ ...pdfStyles.muted, ...pdfStyles.textRight, marginTop: 3 }}
        >
          {COMPANY.address1}
        </PdfText>
        <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
          {COMPANY.address2}
        </PdfText>
      </PdfView>
    </PdfView>
  );
}

/**
 * Registration / Tax ID block (ทะเบียนเลขที่, Tax ID, สาขา)
 * ใช้ร่วมกันทุก PDF page
 */
export function RegistrationInfo({
  align = 'right',
  fontSize = 10,
}: {
  align?: 'left' | 'right';
  fontSize?: number;
}) {
  const style = {
    ...pdfStyles.muted,
    fontSize,
    ...(align === 'right' ? pdfStyles.textRight : {}),
  };
  return (
    <>
      <PdfText style={style}>
        ทะเบียนเลขที่ / Registration No. {COMPANY.registrationNo}
      </PdfText>
      <PdfText style={style}>
        เลขประจำตัวผู้เสียภาษี / Tax ID. {COMPANY.taxId}
      </PdfText>
      <PdfText style={style}>เลขที่สาขา {COMPANY.branchNo}</PdfText>
    </>
  );
}
