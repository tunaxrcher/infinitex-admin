/**
 * Shared utilities for document feature.
 * ไฟล์นี้ไม่มี dependency กับ @react-pdf/renderer
 * จึง safe ที่จะ import ทั้งใน server components, client components และ PDF components
 */

export const formatCurrency = (value: number | undefined | null): string => {
  const num = value ?? 0;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const MONTHS_TH = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

/** แปลง Date → "27 ก.พ. 2569" (Thai Buddhist year, abbreviated month) */
export const toThaiDate = (value?: string | Date | null): string => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return '-';
  }
};
