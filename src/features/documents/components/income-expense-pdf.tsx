import { Document as PdfDocument } from '@react-pdf/renderer';
import { IncomeExpensePage } from './tax-submission-pdf/income-expense-page';
import type { IncomeExpenseItem } from './tax-submission-pdf/shared';

export type { IncomeExpenseItem } from './tax-submission-pdf/shared';

export function IncomeExpensePdf({
  items,
  monthName,
  buddhistYear,
  fontFamily,
  logoSrc,
}: {
  items: IncomeExpenseItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
  logoSrc?: string | null;
}) {
  return (
    <PdfDocument
      title={`ใบสรุปยอดรับ-จ่าย ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Monthly Receipt & Payment Statement"
    >
      <IncomeExpensePage
        items={items}
        monthName={monthName}
        buddhistYear={buddhistYear}
        fontFamily={fontFamily}
        logoSrc={logoSrc}
      />
    </PdfDocument>
  );
}
