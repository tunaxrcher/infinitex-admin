/**
 * Manual search functions as fallback when AI is not available
 */

interface Province {
  pvcode: string;
  pvnamethai: string;
  pvnameeng: string;
}

interface Amphur {
  pvcode: string;
  amcode: string;
  amnamethai: string;
  amnameeng: string;
}

/**
 * Search for province code by name using fuzzy matching
 */
export function findProvinceCodeManual(
  provinceName: string,
  provinces: Province[],
): string {
  if (!provinceName) return '';

  console.log('[ManualSearch] Searching for province:', provinceName);

  // Exact match first
  let found = provinces.find(
    (p) =>
      p.pvnamethai === provinceName ||
      p.pvnameeng.toLowerCase() === provinceName.toLowerCase(),
  );

  if (found) {
    console.log('[ManualSearch] Exact match found:', found);
    return found.pvcode;
  }

  // Fuzzy match - contains
  found = provinces.find(
    (p) =>
      p.pvnamethai.includes(provinceName) ||
      provinceName.includes(p.pvnamethai) ||
      p.pvnameeng.toLowerCase().includes(provinceName.toLowerCase()) ||
      provinceName.toLowerCase().includes(p.pvnameeng.toLowerCase()),
  );

  if (found) {
    console.log('[ManualSearch] Fuzzy match found:', found);
    return found.pvcode;
  }

  console.log('[ManualSearch] No province match found');
  return '';
}

/**
 * Search for amphur code by name and province code
 */
export function findAmphurCodeManual(
  amphurName: string,
  provinceCode: string,
  amphurs: Amphur[],
): string {
  if (!amphurName || !provinceCode) return '';

  console.log('[ManualSearch] Searching for amphur:', {
    amphurName,
    provinceCode,
  });

  // Filter by province first
  const filteredAmphurs = amphurs.filter(
    (a) => a.pvcode === provinceCode && a.amcode !== '00',
  );

  // Exact match first
  let found = filteredAmphurs.find(
    (a) =>
      a.amnamethai === amphurName ||
      a.amnameeng.toLowerCase() === amphurName.toLowerCase(),
  );

  if (found) {
    console.log('[ManualSearch] Exact amphur match found:', found);
    return found.amcode;
  }

  // Fuzzy match - contains
  found = filteredAmphurs.find(
    (a) =>
      a.amnamethai.includes(amphurName) ||
      amphurName.includes(a.amnamethai) ||
      a.amnameeng.toLowerCase().includes(amphurName.toLowerCase()) ||
      amphurName.toLowerCase().includes(a.amnameeng.toLowerCase()),
  );

  if (found) {
    console.log('[ManualSearch] Fuzzy amphur match found:', found);
    return found.amcode;
  }

  console.log('[ManualSearch] No amphur match found');
  return '';
}
