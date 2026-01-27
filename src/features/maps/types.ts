// src/features/maps/types.ts

export type PropertySource = 'INTERNAL' | 'LED';

export interface MapProperty {
  id: string;
  title: string;
  location: string;
  province: string;
  amphur: string;
  price: number;
  formattedPrice: string;
  size: string;
  type: string;
  status: 'ขาย' | 'ขายแล้ว';
  source: PropertySource;
  images: string[];
  lat: number;
  lng: number;
  deedNumber?: string;
  ownerName?: string;
  createdAt: string;
  // LED specific fields
  auctionLot?: string;
  bidNumber?: string;
  caseNumber?: string;
  appraisalPrice?: number;
  reserveFund?: number;
}

export interface MapFilters {
  province?: string;
  amphur?: string;
  source?: PropertySource | 'ALL';
  priceMin?: number;
  priceMax?: number;
  status?: 'ขาย' | 'ขายแล้ว' | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
}

export interface MapApiResponse {
  success: boolean;
  message: string;
  data: MapProperty[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalInternal: number;
    totalLED: number;
    provinceStats: ProvinceStats[];
  };
}

export interface ProvinceStats {
  province: string;
  count: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

// Thai province name mapping (English to Thai)
export const PROVINCE_NAMES_TH: Record<string, string> = {
  'Amnat Charoen': 'อำนาจเจริญ',
  'Ang Thong': 'อ่างทอง',
  Bangkok: 'กรุงเทพมหานคร',
  'Bangkok Metropolis': 'กรุงเทพมหานคร',
  'Bueng Kan': 'บึงกาฬ',
  'Buri Ram': 'บุรีรัมย์',
  Buriram: 'บุรีรัมย์',
  Chachoengsao: 'ฉะเชิงเทรา',
  'Chai Nat': 'ชัยนาท',
  Chaiyaphum: 'ชัยภูมิ',
  Chanthaburi: 'จันทบุรี',
  'Chiang Mai': 'เชียงใหม่',
  'Chiang Rai': 'เชียงราย',
  'Chon Buri': 'ชลบุรี',
  Chonburi: 'ชลบุรี',
  Chumphon: 'ชุมพร',
  Kalasin: 'กาฬสินธุ์',
  'Kamphaeng Phet': 'กำแพงเพชร',
  Kanchanaburi: 'กาญจนบุรี',
  'Khon Kaen': 'ขอนแก่น',
  Krabi: 'กระบี่',
  Lampang: 'ลำปาง',
  Lamphun: 'ลำพูน',
  Loei: 'เลย',
  'Lop Buri': 'ลพบุรี',
  Lopburi: 'ลพบุรี',
  'Mae Hong Son': 'แม่ฮ่องสอน',
  'Maha Sarakham': 'มหาสารคาม',
  Mukdahan: 'มุกดาหาร',
  'Nakhon Nayok': 'นครนายก',
  'Nakhon Pathom': 'นครปฐม',
  'Nakhon Phanom': 'นครพนม',
  'Nakhon Ratchasima': 'นครราชสีมา',
  'Nakhon Sawan': 'นครสวรรค์',
  'Nakhon Si Thammarat': 'นครศรีธรรมราช',
  Nan: 'น่าน',
  Narathiwat: 'นราธิวาส',
  'Nong Bua Lam Phu': 'หนองบัวลำภู',
  'Nong Bua Lamphu': 'หนองบัวลำภู',
  'Nong Khai': 'หนองคาย',
  Nonthaburi: 'นนทบุรี',
  'Pathum Thani': 'ปทุมธานี',
  Pattani: 'ปัตตานี',
  'Phang Nga': 'พังงา',
  Phangnga: 'พังงา',
  Phatthalung: 'พัทลุง',
  Phayao: 'พะเยา',
  Phetchabun: 'เพชรบูรณ์',
  Phetchaburi: 'เพชรบุรี',
  Phichit: 'พิจิตร',
  Phitsanulok: 'พิษณุโลก',
  'Phra Nakhon Si Ayutthaya': 'พระนครศรีอยุธยา',
  Ayutthaya: 'พระนครศรีอยุธยา',
  Phrae: 'แพร่',
  Phuket: 'ภูเก็ต',
  'Prachin Buri': 'ปราจีนบุรี',
  Prachinburi: 'ปราจีนบุรี',
  'Prachuap Khiri Khan': 'ประจวบคีรีขันธ์',
  Ranong: 'ระนอง',
  Ratchaburi: 'ราชบุรี',
  Rayong: 'ระยอง',
  'Roi Et': 'ร้อยเอ็ด',
  'Sa Kaeo': 'สระแก้ว',
  'Sakon Nakhon': 'สกลนคร',
  'Samut Prakan': 'สมุทรปราการ',
  'Samut Sakhon': 'สมุทรสาคร',
  'Samut Songkhram': 'สมุทรสงคราม',
  Saraburi: 'สระบุรี',
  Satun: 'สตูล',
  'Si Sa Ket': 'ศรีสะเกษ',
  Sisaket: 'ศรีสะเกษ',
  'Sing Buri': 'สิงห์บุรี',
  Singburi: 'สิงห์บุรี',
  Songkhla: 'สงขลา',
  Sukhothai: 'สุโขทัย',
  'Suphan Buri': 'สุพรรณบุรี',
  Suphanburi: 'สุพรรณบุรี',
  'Surat Thani': 'สุราษฎร์ธานี',
  Surin: 'สุรินทร์',
  Tak: 'ตาก',
  Trang: 'ตรัง',
  Trat: 'ตราด',
  'Ubon Ratchathani': 'อุบลราชธานี',
  'Udon Thani': 'อุดรธานี',
  'Uthai Thani': 'อุทัยธานี',
  Uttaradit: 'อุตรดิตถ์',
  Yala: 'ยะลา',
  Yasothon: 'ยโสธร',
};
