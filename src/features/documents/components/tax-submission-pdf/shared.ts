import { StyleSheet as PdfStyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

// formatCurrency, toThaiDate re-exported from shared utils (ไม่มี PDF dependency)
export { formatCurrency, toThaiDate, resolvePropertyType } from '@src/features/documents/utils';

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
  currentInstallment?: number;
  totalInstallments?: number;
  totalPropertyValue?: number;
  requestedAmount?: number;
  approvedAmount?: number;
  maxApprovedAmount?: number;
  taxRate: number;
  feeAmount: number;
}

// formatCurrency is now in ../../utils and re-exported above

export const formatDateOrDash = (value?: string | Date | null) => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

export const wrapDocCode = (value?: string | null, chunkSize = 12) => {
  const raw = String(value || '-');
  if (raw === '-') return raw;
  const softBreak = '\u200b';
  let result = '';
  let tokenCount = 0;

  for (const ch of raw) {
    result += ch;
    if (/[A-Za-z0-9]/.test(ch)) {
      tokenCount += 1;
      if (tokenCount >= chunkSize) {
        result += softBreak;
        tokenCount = 0;
      }
    } else {
      tokenCount = 0;
    }
  }

  return result;
};

export const toThaiBahtText = (amount: number): string => {
  const numberText = [
    'ศูนย์',
    'หนึ่ง',
    'สอง',
    'สาม',
    'สี่',
    'ห้า',
    'หก',
    'เจ็ด',
    'แปด',
    'เก้า',
  ];
  const digitText = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  if (!Number.isFinite(amount)) return '(ศูนย์บาทถ้วน)';
  const rounded = Math.round(amount);
  if (rounded === 0) return '(ศูนย์บาทถ้วน)';

  let text = '';
  const chars = String(rounded).split('').reverse();
  for (let i = chars.length - 1; i >= 0; i--) {
    const n = Number(chars[i]);
    const p = i;
    if (n === 0) continue;

    if (p % 6 === 0 && p > 0) {
      text += 'ล้าน';
    }

    if (p % 6 === 1 && n === 1) {
      text += 'สิบ';
      continue;
    }

    if (p % 6 === 1 && n === 2) {
      text += 'ยี่สิบ';
      continue;
    }

    if (p % 6 === 0 && n === 1 && p > 0) {
      text += 'เอ็ด';
      continue;
    }

    text += numberText[n] + digitText[p % 6];
  }

  return `(${text}บาทถ้วน)`;
};

export const pdfStyles = PdfStyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    fontSize: 12,
    color: '#1f2937',
    fontFamily: 'Helvetica',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  muted: { color: '#6b7280', fontSize: 10 },
  textRight: { textAlign: 'right' },
  receiptTitleTh: { fontSize: 34, fontWeight: 700, lineHeight: 1.1 },
  receiptTitleEn: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  tableBlueTitle: {
    color: '#1d4ed8',
    fontSize: 18,
    fontWeight: 700,
    marginTop: 22,
  },
  box: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    padding: 8,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    paddingVertical: 5,
  },
  noBottom: { borderBottomWidth: 0 },
});
