import { Document as PdfDocument } from '@react-pdf/renderer';
import { AppraisalPage } from './tax-submission-pdf/appraisal-page';
import { CloseCasePage } from './tax-submission-pdf/close-case-page';
import { ReceiptPage } from './tax-submission-pdf/receipt-page';
import { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export type { TaxFeeLoanItem } from './tax-submission-pdf/shared';

export function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => [
        <ReceiptPage key={`r-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <CloseCasePage key={`c-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
        <AppraisalPage key={`a-${loan.id}`} loan={loan} fontFamily={fontFamily} />,
      ])}
    </PdfDocument>
  );
}
