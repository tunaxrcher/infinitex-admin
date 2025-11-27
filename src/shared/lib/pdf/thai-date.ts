/**
 * Thai Date Utilities for PDF Generation
 */

export function dayThai(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.getDate().toString();
}

export function monthThai(dateString: string | Date): string {
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

  const date = new Date(dateString);
  return thaiMonths[date.getMonth()];
}

export function yearThai(dateString: string | Date): string {
  const date = new Date(dateString);
  const buddhistYear = date.getFullYear() + 543;
  return buddhistYear.toString();
}

export function formatThaiDate(dateString: string | Date): string {
  return `${dayThai(dateString)} ${monthThai(dateString)} ${yearThai(dateString)}`;
}

/**
 * Convert number to Thai Baht text
 */
export function numToThaiBath(numberStr: string | number): string {
  const number =
    typeof numberStr === 'string'
      ? parseFloat(numberStr.replace(/,/g, ''))
      : numberStr;

  if (isNaN(number)) return '';

  const [integerPart, decimalPart] = number.toString().split('.');

  const thaiNumbers = [
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
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  function convertGroup(num: string): string {
    let result = '';
    const len = num.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(num[i]);
      const position = len - i - 1;

      if (digit === 0) continue;

      if (position === 1 && digit === 1) {
        result += 'สิบ';
      } else if (position === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (position === 0 && digit === 1 && len > 1) {
        result += 'เอ็ด';
      } else {
        result += thaiNumbers[digit] + positions[position];
      }
    }

    return result;
  }

  let result = '';

  // Process integer part in groups of 6 (millions)
  const millions = Math.floor(parseInt(integerPart) / 1000000);
  const remainder = parseInt(integerPart) % 1000000;

  if (millions > 0) {
    result += convertGroup(millions.toString()) + 'ล้าน';
  }

  if (remainder > 0) {
    result += convertGroup(remainder.toString());
  }

  if (result === '') result = 'ศูนย์';

  result += 'บาท';

  // Process decimal part (satang)
  if (decimalPart && parseInt(decimalPart) > 0) {
    const satang = parseInt(decimalPart.padEnd(2, '0').substring(0, 2));
    result += convertGroup(satang.toString()) + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }

  return result;
}

/**
 * Add months to a date
 */
export function addMonths(dateString: string | Date, months: number): Date {
  const date = new Date(dateString);
  date.setMonth(date.getMonth() + months);
  return date;
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
