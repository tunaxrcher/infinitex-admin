import { format } from 'date-fns';

// formatCurrency, toThaiDate re-exported from shared utils (ไม่มี PDF dependency)
export {
  formatCurrency,
  toThaiDate,
  resolvePropertyType,
} from '@src/features/documents/utils';

/**
 * Format date to dd/MM/yyyy in CE (ค.ศ.).
 * ข้อมูลวันที่จาก DB อาจเก็บเป็นปี พ.ศ. (year > 2400)
 * ฟังก์ชันนี้จะแปลงเป็น ค.ศ. ให้อัตโนมัติ
 */
export const formatDateOrDash = (value?: string | Date | null) => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    const year = d.getFullYear();
    if (year > 2400) {
      d.setFullYear(year - 543);
    }
    return format(d, 'dd/MM/yyyy');
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
