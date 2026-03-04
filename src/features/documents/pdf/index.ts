// Barrel export — external consumers import from here
// e.g. import { IncomeExpensePdf, TaxFeeLoanItem, ensureFonts } from '@src/features/documents/pdf';

// Types & constants
export type { TaxFeeLoanItem, ExpenseItem, IncomeExpenseItem } from './shared';
export { COMPANY } from './shared/constants';

// Document wrappers (used by API routes to generate PDFs)
export { TaxSubmissionPackagePdf } from './documents/tax-submission-package-pdf';
export { IncomeExpensePdf } from './documents/income-expense-pdf';
export { ExpenseReceiptPdf } from './documents/expense-receipt-pdf';

// Server-only utilities (font registration + logo loading)
export { ensureFonts, loadLogoBase64 } from './shared/server-utils';
