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
/**
 * แปลง loanType + landType → ชื่อประเภททรัพย์สินที่แสดงใน PDF
 * ลำดับ: landType จากโฉนด → คำนวณจาก loanType → '-'
 */
export const resolvePropertyType = (
  propertyType?: string | null,
  landType?: string | null,
  loanType?: string | null,
): string => {
  if (propertyType) return propertyType;
  if (landType) return landType;
  if (loanType === 'HOUSE_LAND_MORTGAGE') return 'ที่ดินพร้อมสิ่งปลูกสร้าง';
  if (loanType) return 'ที่ดิน'; // loanType อื่นๆ ที่เกี่ยวกับที่ดิน
  return '-';
};

export const toThaiDate = (value?: string | Date | null): string => {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch {
    return '-';
  }
};
