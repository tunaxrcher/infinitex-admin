'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Document as PdfDocument,
  Font,
  Image as PdfImage,
  Page as PdfPage,
  StyleSheet as PdfStyleSheet,
  Text as PdfText,
  View as PdfView,
  pdf,
} from '@react-pdf/renderer';
import { taxSubmissionReportApi } from '@src/features/documents/api';
import { useGetTaxSubmissionReport } from '@src/features/documents/hooks';
import { format } from 'date-fns';
import { Loader2, Printer, Search, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Input } from '@src/shared/components/ui/input';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import { Container } from '@src/shared/components/common/container';

const TAX_RATE_STORAGE_KEY = 'tax_submission_rate_percent';
const PDF_FONT_FAMILY = 'SarabunPDF';
const PDF_FONT_FLAG_KEY = '__tax_submission_pdf_font_registered__';
const PDF_FONT_READY_KEY = '__tax_submission_pdf_font_ready__';

const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i <= 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

const formatCurrency = (value: number | undefined | null) => {
  const num = value ?? 0;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const toBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const registerThaiPdfFont = async () => {
  if (typeof window === 'undefined') return false;
  const globalRef = window as unknown as Record<string, boolean>;

  if (globalRef[PDF_FONT_READY_KEY]) return true;
  if (globalRef[PDF_FONT_FLAG_KEY]) return false;

  globalRef[PDF_FONT_FLAG_KEY] = true;
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch('/fonts/THSarabunNew.ttf'),
      fetch('/fonts/THSarabunNew%20Bold.ttf'),
    ]);

    if (!regularRes.ok || !boldRes.ok) {
      return false;
    }

    const [regularBuffer, boldBuffer] = await Promise.all([
      regularRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);

    Font.register({
      family: PDF_FONT_FAMILY,
      fonts: [
        {
          src: `data:font/ttf;base64,${toBase64(regularBuffer)}`,
          fontWeight: 'normal',
        },
        {
          src: `data:font/ttf;base64,${toBase64(boldBuffer)}`,
          fontWeight: 'bold',
        },
      ],
    });

    globalRef[PDF_FONT_READY_KEY] = true;
    return true;
  } catch {
    return false;
  }
};

interface TaxFeeLoanItem {
  id: string;
  loanId?: string;
  loanNumber: string;
  customerName: string;
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
    deedNumber?: string | null;
    provinceName?: string | null;
    amphurName?: string | null;
    landAreaText?: string | null;
    ownerName?: string | null;
    landType?: string | null;
  }>;
  date?: string | null;
  installmentNumber?: number | null;
  taxRate: number;
  feeAmount: number;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDateOrDash = (value?: string | Date | null) => {
  if (!value) return '-';
  try {
    return format(new Date(value), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

// Keep full reference numbers, but inject soft-wrap points to avoid layout overflow.
const wrapDocCode = (value?: string | null, chunkSize = 12) => {
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

const toThaiBahtText = (amount: number): string => {
  const numberText = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
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

const buildLoanPackageHtml = (
  loans: TaxFeeLoanItem[],
  monthName: string,
  buddhistYear: number,
) => {
  const style = `
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Sarabun', 'TH Sarabun New', Arial, sans-serif; color: #1f2937; margin: 0; }
    .page { width: 100%; min-height: 260mm; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .muted { color: #6b7280; font-size: 12px; }
    .title-th { font-size: 34px; font-weight: 700; line-height: 1.15; margin: 0 0 2px; }
    .title-en { font-size: 14px; color: #4b5563; margin: 0; }
    .grid-2 { display: grid; grid-template-columns: 1.2fr 2fr; gap: 12px; align-items: stretch; }
    .receipt-box {
      border: 1px solid #d1d5db;
      padding: 10px;
      min-height: 142px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .doc-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(2, 68px);
      gap: 6px;
      min-height: 142px;
      height: 100%;
    }
    .doc-item {
      border: 1px solid #d1d5db;
      display: flex;
      align-items: stretch;
      min-height: 68px;
      max-height: 68px;
      overflow: hidden;
    }
    .doc-item .label {
      width: 40%;
      background: #f3f4f6;
      color: #4b5563;
      font-size: 10px;
      line-height: 1.2;
      padding: 6px;
      border-right: 1px solid #d1d5db;
      display: flex;
      align-items: center;
    }
    .doc-item .value {
      width: 60%;
      padding: 7px 6px 6px;
      font-weight: 600;
      font-size: 10px;
      line-height: 1.15;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .doc-item .value.right { justify-content: flex-end; word-break: normal; text-align: right; }
    .table-title { color: #1d4ed8; font-size: 18px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; }
    table.simple { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.simple th, table.simple td { padding: 8px 6px; }
    table.simple thead th { border-top: 2px solid #374151; border-bottom: 1px solid #374151; }
    table.simple tbody td { border-bottom: 1px solid #e5e7eb; }
    table.simple tfoot td { border-top: 1px solid #374151; font-weight: 700; }
    .right { text-align: right; }
    .summary { margin-top: 12px; display: grid; grid-template-columns: 1fr 320px; gap: 20px; align-items: end; }
    .summary-right .line { display: flex; justify-content: space-between; border-bottom: 1px dashed #d1d5db; padding: 4px 0; font-size: 13px; }
    .summary-right .grand { font-size: 18px; font-weight: 700; color: #111827; border-bottom: 2px solid #111827; }
    .note-title { margin-top: 20px; color: #1d4ed8; font-size: 15px; font-weight: 700; }
    .section-title { font-size: 28px; font-weight: 700; text-align: center; margin: 6px 0 8px; }
    .thin-divider { border-top: 1px solid #9ca3af; margin: 6px 0 10px; }
    .box { border: 1px solid #d1d5db; padding: 10px; position: relative; }
    .box-label { position: absolute; top: -11px; left: 14px; background: #fff; padding: 0 8px; font-weight: 700; }
    .kv { display: grid; grid-template-columns: 150px 1fr; gap: 6px; font-size: 13px; margin-bottom: 4px; }
    .a4-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
    .col-7 { grid-column: span 7; }
    .col-5 { grid-column: span 5; }
    .map-placeholder, .photo-placeholder { border: 1px solid #d1d5db; background: #f9fafb; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 12px; }
    .map-placeholder { height: 210px; }
    .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .photo-placeholder { height: 84px; }
    .market-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .market-table th, .market-table td { border-bottom: 1px solid #e5e7eb; padding: 6px; }
    .market-table tbody tr:nth-child(odd) { background: #f8fafc; }
    .sign-area { margin-top: 30px; display: flex; justify-content: flex-end; }
    .sign-line { width: 280px; border-bottom: 1px dashed #6b7280; text-align: center; padding-bottom: 20px; font-size: 12px; color: #4b5563; }
  `;

  const documentPages = loans.flatMap((loan) => {
    const subtotal = Number(loan.feeAmount || 0);
    const vat = subtotal * 0.07;
    const grandTotal = subtotal + vat;
    const titleDeed = loan.titleDeeds?.[0];

    const receiptPage = `
      <section class="page">
        <div class="row">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="/images/logo.png" alt="InfiniteX" style="height:48px; object-fit:contain;" />
          </div>
          <div style="text-align:right;">
            <div style="font-size:31px; font-weight:700;">บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด</div>
            <div class="muted">ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง</div>
            <div class="muted">อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000</div>
          </div>
        </div>
        <div style="margin-top:22px;" class="row">
          <div>
            <h1 class="title-th">ใบเสร็จรับเงิน</h1>
            <p class="title-en">Receipt</p>
          </div>
          <div style="text-align:right;" class="muted">
            <div>ทะเบียนเลขที่ / Registration No. 0345568003383</div>
            <div>เลขประจำตัวผู้เสียภาษี / Tax ID. 0345568003383</div>
            <div>เลขที่สาขา 00000</div>
          </div>
        </div>
        <div class="grid-2" style="margin-top:16px;">
          <div class="receipt-box">
            <div style="font-size:15px; font-weight:700;">${escapeHtml(loan.customerName || '-')}</div>
            <div style="margin-top:8px; font-size:13px;">${escapeHtml(loan.customerAddress || '-')}</div>
            <div style="margin-top:10px; font-size:12px;">เลขประจำตัวผู้เสียภาษี / TAX ID. ${escapeHtml(loan.customerTaxId || '-')}</div>
          </div>
          <div class="doc-grid">
            <div class="doc-item"><div class="label">เลขที่ / No.</div><div class="value right">${escapeHtml(loan.loanNumber || '-')}</div></div>
            <div class="doc-item"><div class="label">เลขที่ใบเสร็จ / Receipt No.</div><div class="value">${escapeHtml(wrapDocCode(loan.paymentRef))}</div></div>
            <div class="doc-item"><div class="label">เลขที่ทำรายการ / Transaction No.</div><div class="value">${escapeHtml(wrapDocCode(loan.transactionId || loan.id || '-'))}</div></div>
            <div class="doc-item"><div class="label">วันออกใบเสร็จ / Receipt Date</div><div class="value right">${escapeHtml(formatDateOrDash(loan.date))}</div></div>
          </div>
        </div>
        <div class="table-title">รายการ / List</div>
        <table class="simple">
          <thead>
            <tr>
              <th>ชื่อรายการ<br/><span class="muted">Item name</span></th>
              <th>รายละเอียด<br/><span class="muted">Details</span></th>
              <th class="right">ค่าธรรมเนียม<br/><span class="muted">Fee</span></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>บันทึกชำระค่าธรรมเนียมสินเชื่อ ${escapeHtml(loan.loanNumber || '-')}</td>
              <td>- ค่าธรรมเนียมเงินกู้<br/>- ค่าดำเนินการ</td>
              <td class="right">${escapeHtml(formatCurrency(subtotal))}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="right">ค่าธรรมเนียมรวมทั้งสิ้น</td>
              <td class="right">${escapeHtml(formatCurrency(subtotal))} บาท</td>
            </tr>
          </tfoot>
        </table>
        <div class="summary">
          <div style="font-size:13px; color:#374151;">${escapeHtml(toThaiBahtText(grandTotal))}</div>
          <div class="summary-right">
            <div class="line"><span>ยอดรวมก่อนภาษี (Subtotal)</span><strong>${escapeHtml(formatCurrency(subtotal))}</strong></div>
            <div class="line"><span>ภาษีมูลค่าเพิ่ม 7% (VAT 7%)</span><strong>${escapeHtml(formatCurrency(vat))}</strong></div>
            <div class="line grand"><span>ยอดรวมทั้งสิ้น (Grand Total)</span><strong>${escapeHtml(formatCurrency(grandTotal))}</strong></div>
          </div>
        </div>
        <div class="note-title">หมายเหตุ</div>
        <div class="muted">-</div>
      </section>
    `;

    const closeCasePage = `
      <section class="page">
        <div class="section-title">ใบปิดเคสสินเชื่อ</div>
        <div class="thin-divider"></div>
        <div class="row" style="margin-bottom:10px;">
          <div><strong>เลขที่สินเชื่อ:</strong> ${escapeHtml(loan.loanNumber || '-')}</div>
          <div><strong>งวดที่:</strong> ${escapeHtml(String(loan.installmentNumber || '-'))}</div>
        </div>
        <div class="a4-grid">
          <div class="col-7">
            <div class="box">
              <div class="box-label">รายละเอียดสินเชื่อ</div>
              <div class="kv"><strong>ชื่อลูกค้า</strong><span>${escapeHtml(loan.customerName || '-')}</span></div>
              <div class="kv"><strong>ผู้ถือกรรมสิทธิ์</strong><span>${escapeHtml(loan.ownerName || '-')}</span></div>
              <div class="kv"><strong>วันที่ทำสัญญา</strong><span>${escapeHtml(formatDateOrDash(loan.contractDate))}</span></div>
              <div class="kv"><strong>วันครบกำหนด</strong><span>${escapeHtml(formatDateOrDash(loan.expiryDate))}</span></div>
              <div class="kv"><strong>ดอกเบี้ยต่อปี</strong><span>${escapeHtml(formatCurrency(loan.interestRate || 0))}%</span></div>
              <div class="kv"><strong>ระยะเวลา</strong><span>${escapeHtml(String(loan.termMonths || 0))} เดือน</span></div>
              <div class="kv"><strong>ยอดสินเชื่อ</strong><span>${escapeHtml(formatCurrency(loan.loanPrincipal || 0))} บาท</span></div>
              <div class="kv"><strong>ค่างวดรายเดือน</strong><span>${escapeHtml(formatCurrency(loan.monthlyPayment || 0))} บาท</span></div>
              <div class="kv"><strong>คงเหลือก่อนปิด</strong><span>${escapeHtml(formatCurrency(loan.remainingBalance || 0))} บาท</span></div>
            </div>
            <div class="box" style="margin-top:14px;">
              <div class="box-label">สรุปรายการปิดเคส</div>
              <div class="kv"><strong>วันที่ชำระ</strong><span>${escapeHtml(formatDateOrDash(loan.date))}</span></div>
              <div class="kv"><strong>เลขที่อ้างอิง</strong><span>${escapeHtml(loan.paymentRef || '-')}</span></div>
              <div class="kv"><strong>ยอดค่าธรรมเนียม</strong><span>${escapeHtml(formatCurrency(loan.feeAmount || 0))} บาท</span></div>
              <div class="kv"><strong>สถานะเคส</strong><span>ปิดเคสเรียบร้อย</span></div>
            </div>
          </div>
          <div class="col-5">
            <div class="box">
              <div class="box-label">ข้อมูลหลักประกัน</div>
              <div class="kv"><strong>เลขที่โฉนด</strong><span>${escapeHtml(loan.titleDeedNumber || titleDeed?.deedNumber || '-')}</span></div>
              <div class="kv"><strong>ที่ตั้ง</strong><span>${escapeHtml(`${titleDeed?.amphurName || '-'} ${titleDeed?.provinceName || '-'}`)}</span></div>
              <div class="kv"><strong>ขนาดที่ดิน</strong><span>${escapeHtml(titleDeed?.landAreaText || '-')}</span></div>
              <div class="kv"><strong>ประเภทที่ดิน</strong><span>${escapeHtml(titleDeed?.landType || '-')}</span></div>
              <div class="map-placeholder" style="margin-top:10px;">แผนที่ทรัพย์ (Placeholder)</div>
            </div>
          </div>
        </div>
      </section>
    `;

    const appraisalPage = `
      <section class="page">
        <div class="section-title">ใบประเมินมูลค่าทรัพย์สิน</div>
        <div class="row" style="align-items:center; margin-bottom:6px;">
          <div style="flex:1; border-top:1px solid #9ca3af;"></div>
          <div style="padding:0 12px; font-size:14px;">รายงานการประเมินราคาอสังหาริมทรัพย์</div>
          <div style="flex:1; border-top:1px solid #9ca3af;"></div>
        </div>
        <div class="row" style="margin:8px 0 14px;">
          <div><strong>หลักทรัพย์:</strong> ${escapeHtml(loan.loanNumber || '-')}</div>
          <div style="text-align:right;">
            <div><strong>วันที่ประเมิน:</strong> ${escapeHtml(formatDateOrDash(loan.valuationDate || loan.date))}</div>
            <div><strong>เลขที่รายงาน:</strong> AV-REP-${escapeHtml((loan.loanNumber || '-').replace(/\s+/g, ''))}</div>
          </div>
        </div>
        <div class="a4-grid">
          <div class="col-7">
            <div class="box">
              <div class="box-label">ข้อมูลทรัพย์สิน</div>
              <div class="kv"><strong>ปลูกสร้างทรัพย์</strong><span>${escapeHtml(titleDeed?.landType || 'ที่ดินพร้อมสิ่งปลูกสร้าง')}</span></div>
              <div class="kv"><strong>เนื้อที่ดิน</strong><span>${escapeHtml(titleDeed?.landAreaText || '-')}</span></div>
              <div class="kv"><strong>ที่ตั้ง</strong><span>${escapeHtml(`${titleDeed?.amphurName || '-'}, ${titleDeed?.provinceName || '-'}`)}</span></div>
              <div class="kv"><strong>ผู้ถือกรรมสิทธิ์</strong><span>${escapeHtml(titleDeed?.ownerName || loan.ownerName || '-')}</span></div>
            </div>
            <div class="box" style="margin-top:14px;">
              <div class="box-label">ผลการประเมินมูลค่า</div>
              <div class="kv"><strong>มูลค่าต้น</strong><span>${escapeHtml(formatCurrency(loan.propertyValue || 0))}</span></div>
              <div class="kv"><strong>มูลค่าปรับตามสภาพ</strong><span>${escapeHtml(formatCurrency((loan.propertyValue || 0) * 0.95))}</span></div>
              <div class="kv" style="margin-top:8px; background:#f3f4f6; padding:8px;">
                <strong style="font-size:20px;">มูลค่าประเมินสุทธิ</strong>
                <span style="font-size:26px; font-weight:700; text-align:right;">${escapeHtml(formatCurrency(loan.estimatedValue || loan.propertyValue || 0))}</span>
              </div>
            </div>
            <div class="box" style="margin-top:14px;">
              <div class="box-label">สรุปการเปรียบเทียบตลาด</div>
              <table class="market-table">
                <thead>
                  <tr><th>ลำดับ</th><th>ทรัพย์เปรียบเทียบ</th><th class="right">ราคาขาย</th></tr>
                </thead>
                <tbody>
                  <tr><td>1</td><td>บ้านใกล้เคียงโซนเดียวกัน</td><td class="right">${escapeHtml(formatCurrency((loan.estimatedValue || 0) * 0.98))}</td></tr>
                  <tr><td>2</td><td>ทรัพย์แปลงติดกัน</td><td class="right">${escapeHtml(formatCurrency((loan.estimatedValue || 0) * 1.02))}</td></tr>
                  <tr><td>3</td><td>ทรัพย์ขนาดใกล้เคียง</td><td class="right">${escapeHtml(formatCurrency((loan.estimatedValue || 0) * 0.96))}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-5">
            <div class="map-placeholder">รูปแผนผังที่ดิน (Placeholder)</div>
            <div class="box" style="margin-top:10px;">
              <div class="box-label">รายละเอียดการประเมิน</div>
              <table class="market-table">
                <tbody>
                  <tr><td>ราคาประเมินที่ดิน</td><td class="right">${escapeHtml(formatCurrency((loan.propertyValue || 0) * 0.55))}</td></tr>
                  <tr><td>ราคาประเมินสิ่งปลูกสร้าง</td><td class="right">${escapeHtml(formatCurrency((loan.propertyValue || 0) * 0.45))}</td></tr>
                  <tr><td>ค่าปรับปรุง/ซ่อมแซม</td><td class="right">-${escapeHtml(formatCurrency((loan.propertyValue || 0) * 0.03))}</td></tr>
                  <tr><td><strong>รวม</strong></td><td class="right"><strong>${escapeHtml(formatCurrency(loan.estimatedValue || loan.propertyValue || 0))}</strong></td></tr>
                </tbody>
              </table>
            </div>
            <div class="box" style="margin-top:10px;">
              <div class="box-label">กฎ.หมายเหตุ</div>
              <ul style="font-size:12px; padding-left:16px; margin:0;">
                <li>ราคาประเมินใช้เพื่อประกอบการอนุมัติสินเชื่อภายใน</li>
                <li>การประเมินอ้างอิงราคาตลาดและสภาพทรัพย์ ณ วันประเมิน</li>
                <li>ผลประเมินอาจเปลี่ยนแปลงตามภาวะตลาด</li>
              </ul>
            </div>
            <div class="photos">
              <div class="photo-placeholder">รูปทรัพย์ 1</div>
              <div class="photo-placeholder">รูปทรัพย์ 2</div>
              <div class="photo-placeholder">รูปทรัพย์ 3</div>
              <div class="photo-placeholder">รูปทรัพย์ 4</div>
            </div>
          </div>
        </div>
        <div class="sign-area">
          <div class="sign-line">วันที่ ......... เดือน ......... พ.ศ. .........</div>
        </div>
      </section>
    `;

    return [receiptPage, closeCasePage, appraisalPage];
  });

  return `
    <!doctype html>
    <html lang="th">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>ชุดเอกสารนำส่งภาษี - ${escapeHtml(monthName)} ${buddhistYear}</title>
        <style>${style}</style>
      </head>
      <body>${documentPages.join('\n')}</body>
    </html>
  `;
};

const pdfStyles = PdfStyleSheet.create({
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
  sectionGap: { marginTop: 14 },
  muted: { color: '#6b7280', fontSize: 10 },
  textRight: { textAlign: 'right' },
  receiptTitleTh: { fontSize: 34, fontWeight: 700, lineHeight: 1.1 },
  receiptTitleEn: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  tableBlueTitle: { color: '#1d4ed8', fontSize: 18, fontWeight: 700, marginTop: 22 },
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

function TaxSubmissionPackagePdf({
  loans,
  monthName,
  buddhistYear,
  fontFamily,
}: {
  loans: TaxFeeLoanItem[];
  monthName: string;
  buddhistYear: number;
  fontFamily: string;
}) {
  return (
    <PdfDocument
      title={`ชุดเอกสารนำส่งภาษี ${monthName} ${buddhistYear}`}
      author="InfiniteX"
      subject="Tax submission package"
    >
      {loans.flatMap((loan) => {
        const subtotal = Number(loan.feeAmount || 0);
        const vat = subtotal * 0.07;
        const grand = subtotal + vat;
        const titleDeed = loan.titleDeeds?.[0];
        const propertyType = (titleDeed?.landType || '').trim();
        const propertyLocation = [titleDeed?.amphurName, titleDeed?.provinceName]
          .filter(Boolean)
          .join(' ');
        const receiptItemName = `ประเภท${propertyType ? ` ${propertyType}` : ''}${
          propertyLocation ? ` ${propertyLocation}` : ''
        }`;
        const netValue = Number(loan.estimatedValue || loan.propertyValue || 0);
        const compareRows = [
          ['1', 'บ้านทาวน์เฮ้าส์ใกล้เคียง', netValue * 0.98],
          ['2', 'ตลบใกล้เคียงทาง', netValue * 1.01],
          ['3', 'ท้องแปลงใกล้เคียง', netValue * 0.95],
        ];

        const receiptPage = (
          <PdfPage key={`r-${loan.id}`} size="A4" style={[pdfStyles.page, { fontFamily }]}>
            {/* 1) Header */}
            <PdfView style={pdfStyles.rowBetween}>
              <PdfView style={{ width: '35%' }}>
                <PdfImage
                  src="/images/logo.png"
                  style={{ width: 140, height: 48, objectFit: 'contain' }}
                />
              </PdfView>
              <PdfView style={{ width: '63%' }}>
                <PdfText style={{ fontSize: 26, fontWeight: 700, textAlign: 'right' }}>
                  บริษัท อินฟินิทเอ็กซ์ ไทย จำกัด
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight, marginTop: 3 }}>
                  ที่อยู่ 11/2 ซอย เอ็นเจ์เนีย 1 ถนนเชียงเมือง ตำบลในเมือง
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000
                </PdfText>
              </PdfView>
            </PdfView>

            {/* 2) Document title + tax info */}
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 20 }}>
              <PdfView>
                <PdfText style={pdfStyles.receiptTitleTh}>ใบเสร็จรับเงิน</PdfText>
                <PdfText style={pdfStyles.receiptTitleEn}>Receipt</PdfText>
              </PdfView>
              <PdfView style={{ width: '44%' }}>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  ทะเบียนเลขที่ / Registration No. 0345568003383
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  เลขประจำตัวผู้เสียภาษี / Tax ID. 0345568003383
                </PdfText>
                <PdfText style={{ ...pdfStyles.muted, ...pdfStyles.textRight }}>
                  เลขที่สาขา 00000
                </PdfText>
              </PdfView>
            </PdfView>

            {/* 3) Customer + doc info */}
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 18, alignItems: 'stretch' }}>
              <PdfView style={{ ...pdfStyles.box, width: '39%', minHeight: 110 }}>
                <PdfText style={{ fontSize: 16, fontWeight: 700 }}>{loan.customerName || '-'}</PdfText>
                <PdfText style={{ marginTop: 10, fontSize: 12 }}>{loan.customerAddress || '-'}</PdfText>
                <PdfText style={{ marginTop: 12, fontSize: 10 }}>
                  เลขประจำตัวผู้เสียภาษี / TAX ID. {loan.customerTaxId || '-'}
                </PdfText>
              </PdfView>

              <PdfView style={{ width: '59%', minHeight: 110 }}>
                <PdfView style={pdfStyles.rowBetween}>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>เลขที่</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>No.</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>
                          {loan.loanNumber || '-'}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>เลขที่ใบเสร็จ</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>Receipt No.</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText
                          style={{
                            fontSize: 8.7,
                            fontWeight: 700,
                            textAlign: 'left',
                            lineHeight: 1.1,
                          }}
                        >
                          {loan.paymentRef || '-'}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                </PdfView>
                <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 6 }}>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>เลขที่ทำรายการ</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>Transaction No.</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText
                          style={{
                            fontSize: 8.7,
                            textAlign: 'left',
                            lineHeight: 1.1,
                          }}
                        >
                          {loan.transactionId || loan.id}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.box, width: '49%', padding: 0, minHeight: 52, maxHeight: 52 }}>
                    <PdfView style={{ flexDirection: 'row', alignItems: 'stretch', height: '100%' }}>
                      <PdfView
                        style={{
                          width: '48%',
                          backgroundColor: '#f3f4f6',
                          justifyContent: 'flex-start',
                          paddingHorizontal: 7,
                          paddingTop: 7,
                          borderRightWidth: 1,
                          borderRightColor: '#d1d5db',
                          borderRightStyle: 'solid',
                        }}
                      >
                        <PdfText style={{ fontSize: 9.8, lineHeight: 1.1 }}>วันออกใบเสร็จ</PdfText>
                        <PdfText style={{ fontSize: 8.6, lineHeight: 1.1, color: '#6b7280' }}>Receipt Date</PdfText>
                      </PdfView>
                      <PdfView style={{ width: '52%', justifyContent: 'flex-start', paddingHorizontal: 6, paddingTop: 7 }}>
                        <PdfText style={{ fontSize: 11, textAlign: 'right' }}>
                          {formatDateOrDash(loan.date)}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                </PdfView>
              </PdfView>
            </PdfView>

            {/* 4) Table section */}
            <PdfText style={pdfStyles.tableBlueTitle}>รายการ / List</PdfText>
            <PdfView
              style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderTopColor: '#111827',
                borderBottomColor: '#111827',
                borderTopStyle: 'solid',
                borderBottomStyle: 'solid',
                paddingVertical: 7,
              }}
            >
              <PdfText style={{ width: '40%', fontSize: 11, textAlign: 'center' }}>ชื่อรายการ</PdfText>
              <PdfText style={{ width: '40%', fontSize: 11, textAlign: 'center' }}>รายละเอียด</PdfText>
              <PdfText style={{ width: '20%', fontSize: 11, textAlign: 'right' }}>ค่าธรรมเนียม</PdfText>
            </PdfView>
            <PdfView style={{ flexDirection: 'row', paddingVertical: 8 }}>
              <PdfText style={{ width: '40%', fontSize: 12 }}>
                {receiptItemName}
              </PdfText>
              <PdfText style={{ width: '40%', fontSize: 12 }}>
                - ค่าธรรมเนียมบริการ{'\n'}- ค่าดำเนินการ โอน-ไถ่ถอน
              </PdfText>
              <PdfText style={{ width: '20%', fontSize: 12, textAlign: 'right' }}>
                {formatCurrency(subtotal)}
              </PdfText>
            </PdfView>
            <PdfView style={{ borderBottomWidth: 1, borderBottomColor: '#111827', borderBottomStyle: 'solid', paddingBottom: 6 }}>
              <PdfText style={{ textAlign: 'right', fontSize: 12 }}>
                ค่าธรรมเนียมรวมทั้งสิ้น {formatCurrency(subtotal)} บาท
              </PdfText>
            </PdfView>

            {/* 5) Summary/VAT */}
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 14, alignItems: 'flex-end' }}>
              <PdfText style={{ width: '55%', fontSize: 12 }}>{toThaiBahtText(grand)}</PdfText>
              <PdfView style={{ width: '43%' }}>
                <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                  <PdfText>ยอดรวมก่อนภาษี (Subtotal)</PdfText>
                  <PdfText>{formatCurrency(subtotal)}</PdfText>
                </PdfView>
                <PdfView style={{ ...pdfStyles.rowBetween, paddingVertical: 3 }}>
                  <PdfText>ภาษีมูลค่าเพิ่ม 7% (VAT 7%)</PdfText>
                  <PdfText>{formatCurrency(vat)}</PdfText>
                </PdfView>
                <PdfView
                  style={{
                    ...pdfStyles.rowBetween,
                    borderTopWidth: 1,
                    borderTopColor: '#111827',
                    borderTopStyle: 'solid',
                    paddingTop: 4,
                  }}
                >
                  <PdfText style={{ fontWeight: 700 }}>ยอดรวมทั้งสิ้น (Grand Total)</PdfText>
                  <PdfText style={{ fontWeight: 700 }}>{formatCurrency(grand)}</PdfText>
                </PdfView>
              </PdfView>
            </PdfView>

            {/* 6) Footer */}
            <PdfText style={{ marginTop: 20, color: '#1d4ed8', fontSize: 14, fontWeight: 700 }}>
              หมายเหตุ
            </PdfText>
            <PdfText style={{ marginTop: 6, color: '#6b7280' }}>-</PdfText>
          </PdfPage>
        );

        const closeCasePage = (
          <PdfPage key={`c-${loan.id}`} size="A4" style={[pdfStyles.page, { fontFamily }]}>
            <PdfText style={{ fontSize: 24, fontWeight: 700, textAlign: 'center' }}>
              ใบปิดเคสสินเชื่อ
            </PdfText>
            <PdfText style={{ ...pdfStyles.muted, textAlign: 'center', marginTop: 2 }}>
              โครงรายละเอียดสินเชื่อและวิเคราะห์สินเชื่อ
            </PdfText>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
              <PdfText style={{ fontWeight: 700 }}>เลขที่สินเชื่อ: {loan.loanNumber || '-'}</PdfText>
              <PdfText style={{ fontWeight: 700 }}>วันที่ปิดเคส: {formatDateOrDash(loan.date)}</PdfText>
            </PdfView>

            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
              <PdfView style={{ width: '63%' }}>
                <PdfView style={pdfStyles.box}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    รายละเอียดสินเชื่อ
                  </PdfText>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ผู้กู้</PdfText>
                    <PdfText>{loan.customerName || '-'}</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ยอดสินเชื่อ</PdfText>
                    <PdfText>{formatCurrency(loan.loanPrincipal || 0)} บาท</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>อัตราดอกเบี้ย</PdfText>
                    <PdfText>{formatCurrency(loan.interestRate || 0)}%</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ระยะเวลา</PdfText>
                    <PdfText>{loan.termMonths || 0} เดือน</PdfText>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                    <PdfText>วันทำสัญญา / วันครบกำหนด</PdfText>
                    <PdfText>
                      {formatDateOrDash(loan.contractDate)} / {formatDateOrDash(loan.expiryDate)}
                    </PdfText>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 10 }}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    วิเคราะห์สินเชื่อ
                  </PdfText>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>คงเหลือก่อนปิด</PdfText>
                    <PdfText>{formatCurrency(loan.remainingBalance || 0)} บาท</PdfText>
                  </PdfView>
                  <PdfView style={pdfStyles.kvRow}>
                    <PdfText>ค่างวด</PdfText>
                    <PdfText>{formatCurrency(loan.monthlyPayment || 0)} บาท</PdfText>
                  </PdfView>
                  <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                    <PdfText>ค่าธรรมเนียมรอบนี้</PdfText>
                    <PdfText>{formatCurrency(loan.feeAmount || 0)} บาท</PdfText>
                  </PdfView>
                </PdfView>
              </PdfView>

              <PdfView style={{ width: '35%' }}>
                <PdfView style={pdfStyles.box}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>หลักประกัน</PdfText>
                  <PdfText>เลขที่โฉนด: {loan.titleDeedNumber || titleDeed?.deedNumber || '-'}</PdfText>
                  <PdfText style={{ marginTop: 4 }}>เนื้อที่: {titleDeed?.landAreaText || '-'}</PdfText>
                  <PdfText style={{ marginTop: 4 }}>
                    ที่ตั้ง: {titleDeed?.amphurName || '-'} {titleDeed?.provinceName || '-'}
                  </PdfText>
                  <PdfText style={{ marginTop: 4 }}>ผู้ถือกรรมสิทธิ์: {titleDeed?.ownerName || loan.ownerName || '-'}</PdfText>
                </PdfView>
                <PdfView style={{ ...pdfStyles.box, marginTop: 10 }}>
                  <PdfText style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>สถานะปิดเคส</PdfText>
                  <PdfText>เลขที่อ้างอิง: {loan.paymentRef || '-'}</PdfText>
                  <PdfText style={{ marginTop: 4 }}>Transaction: {loan.transactionId || '-'}</PdfText>
                  <PdfText style={{ marginTop: 8, color: '#059669', fontWeight: 700 }}>ปิดเคสเรียบร้อย</PdfText>
                </PdfView>
              </PdfView>
            </PdfView>
          </PdfPage>
        );

        const appraisalPage = (
          <PdfPage key={`a-${loan.id}`} size="A4" style={[pdfStyles.page, { fontFamily }]}>
            {/* 1) Header */}
            <PdfText style={{ fontSize: 40, fontWeight: 700, textAlign: 'center' }}>
              ใบประเมินมูลค่าทรัพย์สิน
            </PdfText>
            <PdfView style={{ ...pdfStyles.rowBetween, alignItems: 'center', marginTop: 4 }}>
              <PdfView style={{ width: '28%', borderTopWidth: 1, borderTopColor: '#9ca3af', borderTopStyle: 'solid' }} />
              <PdfText style={{ width: '44%', textAlign: 'center', fontSize: 14 }}>
                รายงานการประเมินราคาอสังหาริมทรัพย์
              </PdfText>
              <PdfView style={{ width: '28%', borderTopWidth: 1, borderTopColor: '#9ca3af', borderTopStyle: 'solid' }} />
            </PdfView>
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 10 }}>
              <PdfView>
                <PdfText style={{ fontWeight: 700 }}>หลักทรัพย์ : {loan.loanNumber || '-'}</PdfText>
                <PdfText style={{ marginTop: 2 }}>คำรับ : วางหลักทรัพย์จำนอง</PdfText>
              </PdfView>
              <PdfView style={pdfStyles.textRight}>
                <PdfText style={{ fontWeight: 700 }}>
                  วันที่ประเมิน : {formatDateOrDash(loan.valuationDate || loan.date)}
                </PdfText>
                <PdfText style={{ marginTop: 2 }}>
                  เลขที่รายงาน : AV-REP-{loan.loanNumber || '-'}
                </PdfText>
              </PdfView>
            </PdfView>

            {/* 2) Main 60:40 */}
            <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
              <PdfView style={{ width: '59%' }}>
                <PdfView style={pdfStyles.box}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 120, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    ข้อมูลทรัพย์สิน
                  </PdfText>
                  <PdfView style={{ marginTop: 4 }}>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ประเภททรัพย์</PdfText>
                      <PdfText>{titleDeed?.landType || 'ที่ดินพร้อมสิ่งปลูกสร้าง'}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>เนื้อที่ดิน</PdfText>
                      <PdfText>{titleDeed?.landAreaText || '-'}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ที่ตั้ง</PdfText>
                      <PdfText>{titleDeed?.amphurName || '-'} / {titleDeed?.provinceName || '-'}</PdfText>
                    </PdfView>
                    <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                      <PdfText>ผู้ถือกรรมสิทธิ์</PdfText>
                      <PdfText>{titleDeed?.ownerName || loan.ownerName || '-'}</PdfText>
                    </PdfView>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 130, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    ผลการประเมินมูลค่า
                  </PdfText>
                  <PdfView style={{ marginTop: 6 }}>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>มูลค่าต้น</PdfText>
                      <PdfText>{formatCurrency(loan.propertyValue || 0)}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>มูลค่าปรับอุปสงค์</PdfText>
                      <PdfText>{formatCurrency((loan.propertyValue || 0) * 0.92)}</PdfText>
                    </PdfView>
                    <PdfView style={{ backgroundColor: '#f3f4f6', padding: 8, marginTop: 6 }}>
                      <PdfView style={pdfStyles.rowBetween}>
                        <PdfText style={{ fontSize: 19, fontWeight: 700 }}>มูลค่าประเมินสุทธิ</PdfText>
                        <PdfText style={{ fontSize: 28, fontWeight: 700 }}>
                          {formatCurrency(netValue)}
                        </PdfText>
                      </PdfView>
                    </PdfView>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 170, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    สรุปการเปรียบเทียบตลาด
                  </PdfText>
                  <PdfView style={{ marginTop: 6 }}>
                    <PdfView style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 5 }}>
                      <PdfText style={{ width: '12%', textAlign: 'center', fontWeight: 700 }}>ลำดับ</PdfText>
                      <PdfText style={{ width: '58%', fontWeight: 700 }}>ทรัพย์จดเทียบเคียง</PdfText>
                      <PdfText style={{ width: '30%', textAlign: 'right', fontWeight: 700 }}>ราคาขาย</PdfText>
                    </PdfView>
                    {compareRows.map((r, idx) => (
                      <PdfView
                        key={r[0]}
                        style={{
                          flexDirection: 'row',
                          paddingVertical: 5,
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        }}
                      >
                        <PdfText style={{ width: '12%', textAlign: 'center' }}>{r[0]}</PdfText>
                        <PdfText style={{ width: '58%' }}>{r[1]}</PdfText>
                        <PdfText style={{ width: '30%', textAlign: 'right' }}>{formatCurrency(Number(r[2]))}</PdfText>
                      </PdfView>
                    ))}
                    <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 4 }}>
                      <PdfText style={{ fontWeight: 700 }}>ค่ายสื่อกลาง</PdfText>
                      <PdfText style={{ fontWeight: 700 }}>{formatCurrency(netValue * 0.96)}</PdfText>
                    </PdfView>
                  </PdfView>
                </PdfView>
              </PdfView>

              <PdfView style={{ width: '39%' }}>
                <PdfView style={{ ...pdfStyles.box, height: 190, justifyContent: 'center', alignItems: 'center' }}>
                  <PdfText style={{ color: '#6b7280' }}>แผนผังที่ดิน (Placeholder)</PdfText>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 130, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    รายละเอียดการประเมิน
                  </PdfText>
                  <PdfView style={{ marginTop: 6 }}>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ราคาที่ดิน</PdfText>
                      <PdfText>{formatCurrency((loan.propertyValue || 0) * 0.55)}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>สิ่งปลูกสร้าง</PdfText>
                      <PdfText>{formatCurrency((loan.propertyValue || 0) * 0.40)}</PdfText>
                    </PdfView>
                    <PdfView style={pdfStyles.kvRow}>
                      <PdfText>ค่าเสื่อม/ปรับปรุง</PdfText>
                      <PdfText>-{formatCurrency((loan.propertyValue || 0) * 0.03)}</PdfText>
                    </PdfView>
                    <PdfView style={{ ...pdfStyles.kvRow, ...pdfStyles.noBottom }}>
                      <PdfText style={{ fontWeight: 700 }}>รวม</PdfText>
                      <PdfText style={{ fontWeight: 700 }}>{formatCurrency(netValue)}</PdfText>
                    </PdfView>
                  </PdfView>
                </PdfView>

                <PdfView style={{ ...pdfStyles.box, marginTop: 12 }}>
                  <PdfText style={{ marginTop: -16, backgroundColor: '#fff', width: 80, textAlign: 'center', fontWeight: 700, marginLeft: 10 }}>
                    กฎ.หมายเหตุ
                  </PdfText>
                  <PdfText style={{ marginTop: 6, fontSize: 11 }}>
                    • ราคาประเมินเพื่อใช้ประกอบการพิจารณาสินเชื่อ
                  </PdfText>
                  <PdfText style={{ marginTop: 4, fontSize: 11 }}>
                    • อ้างอิงจากราคาตลาดและสภาพทรัพย์ปัจจุบัน
                  </PdfText>
                  <PdfText style={{ marginTop: 4, fontSize: 11 }}>
                    • ค่าประเมินอาจเปลี่ยนแปลงตามภาวะตลาด
                  </PdfText>
                </PdfView>

                <PdfView style={{ ...pdfStyles.rowBetween, marginTop: 12 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <PdfView
                      key={n}
                      style={{
                        width: '48%',
                        height: 70,
                        borderWidth: 1,
                        borderColor: '#d1d5db',
                        borderStyle: 'solid',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <PdfText style={{ fontSize: 10, color: '#6b7280' }}>รูปทรัพย์ {n}</PdfText>
                    </PdfView>
                  ))}
                </PdfView>
              </PdfView>
            </PdfView>

            {/* 3) footer sign */}
            <PdfView style={{ marginTop: 20, alignItems: 'flex-end' }}>
              <PdfView style={{ width: 280, borderBottomWidth: 1, borderBottomColor: '#6b7280', borderBottomStyle: 'dashed', paddingBottom: 18 }}>
                <PdfText style={{ textAlign: 'center', color: '#6b7280' }}>
                  วันที่ ......... เดือน ......... พ.ศ. .........
                </PdfText>
              </PdfView>
            </PdfView>
          </PdfPage>
        );

        return [receiptPage, closeCasePage, appraisalPage];
      })}
    </PdfDocument>
  );
}

type DetailType =
  | 'loan-open'
  | 'loan-total'
  | 'close-payment'
  | 'fee-payment'
  | 'expense'
  | 'income-expense-total';

interface DetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  loading: boolean;
  type: DetailType;
  onPrintLoan?: (loan: TaxFeeLoanItem) => void;
}

function DetailModal({
  open,
  onOpenChange,
  title,
  data,
  loading,
  type,
  onPrintLoan,
}: DetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const filteredData = useMemo(() => {
    if (!searchQuery || !data) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((item) => {
      if (type === 'expense') {
        return [item.docNumber, item.title, item.note, item.cashFlowName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }

      if (type === 'income-expense-total') {
        return [
          item.source,
          item.loanNumber,
          item.customerName,
          item.docNumber,
          item.title,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }

      return [item.loanNumber, item.customerName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [data, searchQuery, type]);

  const totalAmount = useMemo(() => {
    if (!filteredData) return 0;

    if (type === 'loan-open') {
      return filteredData.reduce(
        (sum, item) => sum + Number(item.principalAmount || 0),
        0,
      );
    }

    if (type === 'fee-payment') {
      return filteredData.reduce((sum, item) => sum + Number(item.feeAmount || 0), 0);
    }

    if (type === 'income-expense-total') {
      return filteredData.reduce((sum, item) => {
        const amount = Number(item.amount || 0);
        return item.type === 'expense' ? sum - amount : sum + amount;
      }, 0);
    }

    return filteredData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredData, type]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
        </div>
      );
    }

    if (!filteredData || filteredData.length === 0) {
      return (
        <div className="py-10 text-center text-gray-500">
          {searchQuery ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
        </div>
      );
    }

    if (type === 'loan-open') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่เปิดสัญญา</TableHead>
                <TableHead>เลขที่สินเชื่อ</TableHead>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead className="text-right">ยอดเปิดสินเชื่อ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{item.loanNumber || '-'}</TableCell>
                  <TableCell>{item.customerName || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.principalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (type === 'expense') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>เลขที่ใบสำคัญ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>บัญชี</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{item.docNumber || '-'}</TableCell>
                  <TableCell>{item.title || '-'}</TableCell>
                  <TableCell>{item.cashFlowName || '-'}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    -{formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>{item.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (type === 'income-expense-total') {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>แหล่งข้อมูล</TableHead>
                <TableHead>อ้างอิง</TableHead>
                <TableHead className="text-right">จำนวนเงิน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item: any) => (
                <TableRow key={`${item.type}-${item.id}`}>
                  <TableCell>
                    {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>
                    {item.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                  </TableCell>
                  <TableCell>{item.source || '-'}</TableCell>
                  <TableCell>
                    {item.loanNumber || item.docNumber || item.title || '-'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      item.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.type === 'income' ? '' : '-'}
                    {formatCurrency(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>วันที่ชำระ</TableHead>
              <TableHead>เลขที่สินเชื่อ</TableHead>
              <TableHead>ชื่อลูกค้า</TableHead>
              {(type === 'fee-payment' || type === 'loan-total') && (
                <TableHead className="text-right">ยอดสินเชื่อ</TableHead>
              )}
              {type === 'fee-payment' && (
                <TableHead className="text-right">เรท(%)</TableHead>
              )}
              {(type === 'fee-payment' || type === 'loan-total') && (
                <TableHead className="text-right">
                  {type === 'fee-payment' ? 'ชำระค่าธรรมเนียม' : 'จำนวนเงิน'}
                </TableHead>
              )}
              {type === 'fee-payment' && <TableHead className="w-[80px] text-center">พิมพ์</TableHead>}
              {type === 'close-payment' && (
                <TableHead className="text-right">ชำระปิดบัญชี</TableHead>
              )}
              {type === 'loan-total' && <TableHead>รายการ</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item: any) => {
              const amount =
                type === 'fee-payment'
                  ? Number(item.feeAmount || 0)
                  : Number(item.amount || 0);
              const loanPrincipal = Number(item.loanPrincipal || 0);
              const isFeeRow = item.type === 'fee-payment';

              return (
                <TableRow key={`${item.type || type}-${item.id}`}>
                  <TableCell>
                    {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{item.loanNumber || '-'}</TableCell>
                  <TableCell>{item.customerName || '-'}</TableCell>

                  {(type === 'fee-payment' || type === 'loan-total') && (
                    <TableCell className="text-right font-mono">
                      {formatCurrency(loanPrincipal)}
                    </TableCell>
                  )}

                  {type === 'fee-payment' && (
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.taxRate)}
                    </TableCell>
                  )}

                  {(type === 'fee-payment' || type === 'loan-total') && (
                    <TableCell
                      className={`text-right font-mono ${
                        isFeeRow ? 'text-green-600' : ''
                      }`}
                    >
                      {formatCurrency(amount)}
                    </TableCell>
                  )}
                  {type === 'fee-payment' && (
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 border-[#e5d8c7] bg-[#f7efe6] text-[#a67752] hover:bg-[#efdfcd]"
                        onClick={() => onPrintLoan?.(item as TaxFeeLoanItem)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}

                  {type === 'close-payment' && (
                    <TableCell className="text-right font-mono">
                      {formatCurrency(amount)}
                    </TableCell>
                  )}

                  {type === 'loan-total' && (
                    <TableCell>{isFeeRow ? 'ค่าธรรมเนียม' : 'ปิดบัญชี'}</TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
        <DialogHeader className="flex flex-col items-center gap-4 pb-4">
          <div className="flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={
              type === 'expense'
                ? 'ค้นหาเลขที่ใบสำคัญ, หมวดหมู่...'
                : 'ค้นหาเลขที่สินเชื่อ, ชื่อลูกค้า...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[calc(90vh-300px)]">{renderContent()}</ScrollArea>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-500">
            {searchQuery ? (
              <>
                พบ {filteredData?.length || 0} จาก {data?.length || 0} รายการ
              </>
            ) : (
              <>รวมทั้งหมด {data?.length || 0} รายการ</>
            )}
          </div>
          <div className="text-lg font-semibold">
            ยอดรวม:{' '}
            <span
              className={
                type === 'expense'
                  ? 'text-red-600'
                  : totalAmount >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
              }
            >
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TaxSubmissionReportPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [taxRate, setTaxRate] = useState(1.25);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState('1.25');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<DetailType>('loan-open');
  const [modalLoading, setModalLoading] = useState(false);
  const [printingMonth, setPrintingMonth] = useState<number | null>(null);

  useEffect(() => {
    const storedRate = window.localStorage.getItem(TAX_RATE_STORAGE_KEY);
    if (!storedRate) return;
    const parsed = Number(storedRate);
    if (Number.isNaN(parsed)) return;
    setTaxRate(parsed);
    setTaxRateInput(parsed.toString());
  }, []);

  const { data, isLoading } = useGetTaxSubmissionReport({
    year: selectedYear,
    taxRate,
  });

  const reportData = data?.data || { data: [], totals: {} };
  const monthlyData = reportData.data || [];
  const totals = reportData.totals || {
    loanOpenAmount: 0,
    loanTotalAmount: 0,
    closeAccountPayment: 0,
    feePayment: 0,
    expense: 0,
    incomeExpenseTotal: 0,
  };

  const yearOptions = generateYearOptions();

  const handleCellClick = useCallback(
    async (month: number, monthName: string, type: DetailType, title: string) => {
      setModalLoading(true);
      setModalTitle(`${title} - ${monthName} ${selectedYear + 543}`);
      setModalType(type);
      setModalOpen(true);

      try {
        const response = await taxSubmissionReportApi.getMonthlyDetails(
          selectedYear,
          month,
          type,
          taxRate,
        );
        setModalData(response.data || []);
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
        setModalData([]);
      } finally {
        setModalLoading(false);
      }
    },
    [selectedYear, taxRate],
  );

  const saveTaxRate = () => {
    const value = Number(taxRateInput);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error('กรุณาระบุเรทระหว่าง 0 - 100');
      return;
    }
    setTaxRate(value);
    window.localStorage.setItem(TAX_RATE_STORAGE_KEY, value.toString());
    setRateDialogOpen(false);
    toast.success('บันทึกเรทค่าธรรมเนียมสำเร็จ');
  };

  const openPrintPreview = useCallback(
    async (loans: TaxFeeLoanItem[], monthName: string) => {
      const hasThaiFont = await registerThaiPdfFont();
      const viewerWindow = window.open('', '_blank');
      if (!viewerWindow) {
        toast.error('ไม่สามารถเปิด PDF Viewer ได้ กรุณาอนุญาต Pop-up');
        return;
      }

      viewerWindow.document.write(`
        <!doctype html>
        <html lang="th">
          <head>
            <meta charset="UTF-8" />
            <title>กำลังสร้าง PDF...</title>
            <style>
              body { font-family: Arial, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; color:#374151; }
            </style>
          </head>
          <body>กำลังสร้างเอกสาร PDF...</body>
        </html>
      `);
      viewerWindow.document.close();

      try {
        const blob = await pdf(
          <TaxSubmissionPackagePdf
            loans={loans}
            monthName={monthName}
            buddhistYear={selectedYear + 543}
            fontFamily={hasThaiFont ? PDF_FONT_FAMILY : 'Helvetica'}
          />,
        ).toBlob();
        const url = URL.createObjectURL(blob);
        viewerWindow.document.open();
        viewerWindow.document.write(`
          <!doctype html>
          <html lang="th">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>PDF Viewer - ชุดเอกสารนำส่งภาษี</title>
              <style>
                html, body { margin:0; padding:0; height:100%; background:#111827; }
                .viewer-wrap { height:100%; display:flex; flex-direction:column; }
                .toolbar {
                  height:44px;
                  background:#1f2937;
                  color:#fff;
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  padding:0 12px;
                  font-family:Arial, sans-serif;
                  font-size:13px;
                }
                .toolbar a {
                  color:#fff;
                  text-decoration:none;
                  border:1px solid rgba(255,255,255,0.35);
                  border-radius:6px;
                  padding:6px 10px;
                  margin-left:8px;
                }
                iframe { width:100%; height:calc(100% - 44px); border:none; background:#374151; }
              </style>
            </head>
            <body>
              <div class="viewer-wrap">
                <div class="toolbar">
                  <div>PDF Viewer: ชุดเอกสารนำส่งภาษี</div>
                  <div>
                    <a href="${url}" download="tax-submission-package.pdf">Download</a>
                    <a href="${url}" target="_blank">Open Native Viewer</a>
                  </div>
                </div>
                <iframe src="${url}#toolbar=1&navpanes=1&scrollbar=1" title="PDF Viewer"></iframe>
              </div>
            </body>
          </html>
        `);
        viewerWindow.document.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown PDF error';
        viewerWindow.document.open();
        viewerWindow.document.write(`
          <!doctype html>
          <html lang="th">
            <head><meta charset="UTF-8" /><title>PDF Error</title></head>
            <body style="font-family:Arial,sans-serif;padding:24px;">
              <h2>สร้าง PDF ไม่สำเร็จ</h2>
              <p>${escapeHtml(errorMessage)}</p>
            </body>
          </html>
        `);
        viewerWindow.document.close();
        toast.error(`สร้าง PDF ไม่สำเร็จ: ${errorMessage}`);
      }
    },
    [selectedYear],
  );

  const handlePrintMonthPackage = useCallback(
    async (month: number, monthName: string) => {
      setPrintingMonth(month);
      try {
        const response = await taxSubmissionReportApi.getMonthlyDetails(
          selectedYear,
          month,
          'fee-payment',
          taxRate,
        );
        const rawItems = (response.data || []) as TaxFeeLoanItem[];
        const itemsMap = new Map<string, TaxFeeLoanItem>();
        for (const item of rawItems) {
          const key = item.loanId || item.loanNumber || item.id;
          const existing = itemsMap.get(key);
          if (!existing) {
            itemsMap.set(key, { ...item });
            continue;
          }
          existing.feeAmount = Number(existing.feeAmount || 0) + Number(item.feeAmount || 0);
          if (!existing.date && item.date) {
            existing.date = item.date;
          }
        }
        const items = Array.from(itemsMap.values());
        if (items.length === 0) {
          toast.error('ไม่พบรายการชำระค่าธรรมเนียมของเดือนนี้');
          return;
        }
        await openPrintPreview(items, monthName);
      } catch (error) {
        toast.error('ไม่สามารถสร้างเอกสาร PDF ได้');
      } finally {
        setPrintingMonth(null);
      }
    },
    [openPrintPreview, selectedYear, taxRate],
  );

  const handlePrintSingleLoanPackage = useCallback(
    async (loan: TaxFeeLoanItem) => {
      await openPrintPreview([loan], 'เอกสารรายสินเชื่อ');
    },
    [openPrintPreview],
  );

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="gradientText text-xl font-bold text-foreground">
              รายงานนำส่งภาษี
            </h1>
            <span className="text-sm text-muted-foreground">
              สรุปรายเดือนสำหรับข้อมูลนำส่งภาษี
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ปี:</span>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year + 543}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setRateDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              ตั้งค่าเรทค่าธรรมเนียม
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ยอดรวมสินเชื่อทั้งปี
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totals.loanTotalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ชำระค่าธรรมเนียมทั้งปี
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.feePayment)}
              </div>
              <p className="text-xs text-muted-foreground">
                เรทปัจจุบัน {formatCurrency(taxRate)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                รวมรับ/จ่ายทั้งปี
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totals.incomeExpenseTotal >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(totals.incomeExpenseTotal)}
              </div>
              <p className="text-xs text-muted-foreground">บาท</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">เดือน</TableHead>
                  <TableHead className="text-right font-semibold">
                    ยอดเปิดสินเชื่อ
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ยอดรวมสินเชื่อ
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ชำระปิดบัญชี
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    ชำระค่าธรรมเนียม
                  </TableHead>
                  <TableHead className="text-right font-semibold">รายจ่าย</TableHead>
                  <TableHead className="text-right font-semibold">รวมรับ/จ่าย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month: any) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.monthName}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-primary"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'loan-open',
                            'ยอดเปิดสินเชื่อ',
                          )
                        }
                      >
                        {formatCurrency(month.loanOpenAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-primary"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'loan-total',
                            'ยอดรวมสินเชื่อ',
                          )
                        }
                      >
                        {formatCurrency(month.loanTotalAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-primary"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'close-payment',
                            'ชำระปิดบัญชี',
                          )
                        }
                      >
                        {formatCurrency(month.closeAccountPayment)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className="cursor-pointer underline decoration-dotted hover:text-green-700"
                          onClick={() =>
                            handleCellClick(
                              month.month,
                              month.monthName,
                              'fee-payment',
                              'ชำระค่าธรรมเนียม',
                            )
                          }
                        >
                          {formatCurrency(month.feePayment)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={printingMonth === month.month}
                          className="h-8 w-8 border-[#e5d8c7] bg-[#f7efe6] text-[#a67752] hover:bg-[#efdfcd]"
                          onClick={() =>
                            handlePrintMonthPackage(month.month, month.monthName)
                          }
                        >
                          {printingMonth === month.month ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-red-600">
                      <span
                        className="cursor-pointer underline decoration-dotted hover:text-red-700"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'expense',
                            'รายจ่าย',
                          )
                        }
                      >
                        {formatCurrency(month.expense)}
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        (month.incomeExpenseTotal ?? 0) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      <span
                        className="cursor-pointer underline decoration-dotted"
                        onClick={() =>
                          handleCellClick(
                            month.month,
                            month.monthName,
                            'income-expense-total',
                            'รวมรับ/จ่าย',
                          )
                        }
                      >
                        {formatCurrency(month.incomeExpenseTotal)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>ยอดรวม</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.loanOpenAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.loanTotalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(totals.closeAccountPayment)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatCurrency(totals.feePayment)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-600">
                    {formatCurrency(totals.expense)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      (totals.incomeExpenseTotal ?? 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(totals.incomeExpenseTotal)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>

      <DetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
        type={modalType}
        onPrintLoan={handlePrintSingleLoanPackage}
      />

      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ตั้งค่าเรทชำระค่าธรรมเนียม</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">เรท (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxRateInput}
                onChange={(e) => setTaxRateInput(e.target.value)}
                placeholder="เช่น 1.25"
              />
              <p className="text-xs text-muted-foreground">
                ระบบจะใช้สูตร: ยอดสินเชื่อ x เรท สำหรับรายการชำระค่างวด
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={saveTaxRate}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
