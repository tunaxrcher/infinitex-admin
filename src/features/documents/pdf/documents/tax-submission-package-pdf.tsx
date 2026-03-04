import { Document as PdfDocument } from '@react-pdf/renderer';
import { AppraisalPage } from '../pages/appraisal-page';
import { CloseCasePage } from '../pages/close-case-page';
import { ReceiptPage } from '../pages/receipt-page';
import { TaxFeeLoanItem } from '../shared';

export type { TaxFeeLoanItem } from '../shared';

export function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
  logoSrc,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
  logoSrc?: string | null;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => [
        <ReceiptPage
          key={`r-${loan.id}`}
          loan={loan}
          fontFamily={fontFamily}
          logoSrc={logoSrc}
        />,
        <CloseCasePage
          key={`c-${loan.id}`}
          loan={loan}
          fontFamily={fontFamily}
        />,
        <AppraisalPage
          key={`a-${loan.id}`}
          loan={loan}
          fontFamily={fontFamily}
        />,
      ])}
    </PdfDocument>
  );
}
