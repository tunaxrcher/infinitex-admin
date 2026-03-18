export interface TaxFeeLoanItem {
  id: string;
  loanId?: string;
  loanNumber: string;
  customerName: string;
  placeName?: string;
  placeDisplay?: string;
  allPlaceNames?: string[];
  titleDeedCount?: number;
  propertyType?: string;
  customerAddress?: string;
  customerTaxId?: string;
  paymentRef?: string;
  transactionId?: string;
  loanPrincipal: number;
  interestRate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  remainingBalance?: number;
  contractDate?: string | null;
  expiryDate?: string | null;
  titleDeedNumber?: string | null;
  ownerName?: string;
  propertyValue?: number;
  estimatedValue?: number;
  valuationDate?: string | null;
  titleDeeds?: Array<{
    isPrimary?: boolean | null;
    deedNumber?: string | null;
    provinceName?: string | null;
    amphurName?: string | null;
    landAreaText?: string | null;
    ownerName?: string | null;
    landType?: string | null;
    imageUrl?: string | null;
  }>;
  primaryImageUrl?: string | null;
  supportingImages?: string[];
  date?: string | null;
  installmentNumber?: number | null;
  loanStatus?: string | null;
  loanType?: string | null;
  valuationResult?: {
    estimatedValue?: number;
    confidence?: number;
    reasoning?: string;
  } | null;
  currentInstallment?: number;
  totalInstallments?: number;
  totalPropertyValue?: number;
  requestedAmount?: number;
  approvedAmount?: number;
  maxApprovedAmount?: number;
  taxRate: number;
  feeAmount: number;
}

export interface ExpenseItem {
  id: string;
  date?: string | null;
  docNumber?: string | null;
  title?: string | null;
  cashFlowName?: string | null;
  note?: string | null;
  amount: number;
  // Withholding tax (หัก ณ ที่จ่าย)
  withholdingTax?: boolean;
  withholdingTaxRate?: number | null;
  withholdingTaxRecipient?: string | null;
  withholdingTaxAddress?: string | null;
  withholdingTaxApprover?: string | null;
}

export interface IncomeExpenseItem {
  id: string;
  type: 'income' | 'expense';
  source?: string;
  date?: string | Date | null;
  loanNumber?: string;
  customerName?: string;
  propertyType?: string;
  placeName?: string;
  titleDeedCount?: number;
  allPlaceNames?: string[];
  docNumber?: string;
  title?: string;
  note?: string | null;
  amount: number;
}
