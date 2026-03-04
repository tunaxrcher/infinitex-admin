import { Document as PdfDocument } from '@react-pdf/renderer';
import { ExpenseReceiptPage } from '../pages/expense-receipt-page';
import type { ExpenseItem } from '../shared';

export type { ExpenseItem } from '../shared';

export function ExpenseReceiptPdf({
  expenses,
  monthName,
  buddhistYear,
  fontFamily,
  logoSrc,
}: {
  expenses: ExpenseItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
  logoSrc?: string | null;
}) {
  return (
    <PdfDocument
      title={`ใบสำคัญจ่าย ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Expense payment voucher"
    >
      {expenses.map((expense) => (
        <ExpenseReceiptPage
          key={`exp-${expense.id}`}
          expense={expense}
          fontFamily={fontFamily}
          logoSrc={logoSrc}
        />
      ))}
    </PdfDocument>
  );
}
