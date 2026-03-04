import { Document as PdfDocument } from '@react-pdf/renderer';
import { IncomeExpensePage } from '../pages/income-expense-page';
import type { IncomeExpenseItem } from '../shared';

export type { IncomeExpenseItem } from '../shared';

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
