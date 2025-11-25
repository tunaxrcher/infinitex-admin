/**
 * Thai Date Utilities
 * Helper functions for converting dates to Thai Buddhist calendar format
 */

const thaiMonths = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

/**
 * Get Thai day from date
 * @param date - Date string or Date object
 * @returns Day in Thai format (1-31)
 */
export function dayThai(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDate().toString();
}

/**
 * Get Thai month name from date
 * @param date - Date string or Date object
 * @returns Month name in Thai
 */
export function monthThai(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return thaiMonths[d.getMonth()];
}

/**
 * Get Thai Buddhist year from date
 * @param date - Date string or Date object
 * @returns Year in Buddhist calendar (e.g., 2567)
 */
export function yearThai(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (d.getFullYear() + 543).toString();
}

/**
 * Format full Thai date
 * @param date - Date string or Date object
 * @returns Full date in Thai format (e.g., "1 มกราคม 2567")
 */
export function formatThaiDate(date: string | Date): string {
  return `${dayThai(date)} ${monthThai(date)} ${yearThai(date)}`;
}

/**
 * Convert number to Thai Baht text
 * @param amount - Amount in baht
 * @returns Thai text representation of the amount
 */
export function numToThaiBath(amount: string | number): string {
  const num =
    typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;

  if (isNaN(num)) return 'ศูนย์บาทถ้วน';

  const [intPart, decPart] = num.toFixed(2).split('.');

  const thaiNums = [
    '',
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
  const thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertInt(n: string): string {
    if (n === '0') return '';

    let result = '';
    const len = n.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(n[i]);
      const unit = len - i - 1;

      if (digit === 0) continue;

      if (unit === 1 && digit === 1) {
        result += 'สิบ';
      } else if (unit === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (unit === 0 && digit === 1 && len > 1) {
        result += 'เอ็ด';
      } else {
        result += thaiNums[digit] + thaiUnits[unit];
      }
    }

    return result;
  }

  let result = convertInt(intPart);
  result = result || 'ศูนย์';
  result += 'บาท';

  if (parseInt(decPart) === 0) {
    result += 'ถ้วน';
  } else {
    result += convertInt(decPart) + 'สตางค์';
  }

  return result;
}
