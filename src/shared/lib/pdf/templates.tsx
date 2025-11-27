/**
 * PDF Templates
 * Reusable PDF document templates
 */

import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { THAI_FONT } from './fonts';
import {
  addMonths,
  dayThai,
  formatThaiDate,
  monthThai,
  numToThaiBath,
  yearThai,
} from './thai-date';

// ============================================
// TYPES
// ============================================

export interface LoanContractData {
  loan_customer: string;
  loan_date_promise: string;
  loan_summary_no_vat: number;
  loan_payment_interest: number;
  loan_installment_date: string;
  loan_payment_year_counter: number;
  customer_age?: number;
  customer_address?: string;
  lender_name?: string;
  note?: string;
}

export interface InstallmentData {
  loan_payment_installment: number;
  loan_payment_date: string;
  loan_payment_customer: string;
  loan_employee: string;
  loan_payment_amount: number;
  loan_balance: number;
}

export interface LoanData {
  loan_customer: string;
  loan_employee: string;
  loan_date_promise: string;
  loan_summary_no_vat: number;
  loan_payment_interest: number;
  loan_payment_year_counter: number;
  loan_payment_month: number;
  loan_installment_date: string;
  customer_address?: string;
  customer_phone?: string;
  branch?: string;
}

// ============================================
// CONSTANTS
// ============================================

// A4 width = 595pt, with padding 40 each side = 515pt usable width
const PAGE_WIDTH = 515;

// Helper to convert percentage to points
const w = (percent: number) => (PAGE_WIDTH * percent) / 100;

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: THAI_FONT,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    width: PAGE_WIDTH,
  },
  text: {
    fontSize: 13,
  },
  textBold: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  underline: {
    borderBottomWidth: 0.5,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#000',
  },
  centerText: {
    textAlign: 'center',
  },
});

// ============================================
// LOAN CONTRACT PDF
// ============================================

export const LoanContractPDF: React.FC<{ data: LoanContractData }> = ({
  data,
}) => {
  const {
    loan_customer,
    loan_date_promise,
    loan_summary_no_vat,
    loan_payment_interest,
    loan_installment_date,
    loan_payment_year_counter,
    customer_age = 0,
    customer_address = '',
    lender_name = '',
    note = '',
  } = data;

  const months = loan_payment_year_counter * 12;
  const lastPaymentDate = addMonths(loan_installment_date, months - 1);
  const firstPaymentDate = addMonths(loan_installment_date, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Spacer */}
        <View style={{ height: 25 }} />

        {/* Header */}
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>
            หนังสือสัญญากู้เงิน
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ height: 10 }} />

        {/* สัญญาทำขึ้นที่ */}
        <View style={styles.row}>
          <View style={{ width: w(55) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(10) }}><Text style={styles.text}>สัญญาทำขึ้นที่</Text></View>
          <View style={{ width: w(35) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* วันที่ */}
        <View style={styles.row}>
          <View style={{ width: w(55) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(2) }}><Text style={styles.text}>วัน</Text></View>
          <View style={{ width: w(8) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{dayThai(loan_date_promise)}</Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>เดือน</Text></View>
          <View style={{ width: w(19) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{monthThai(loan_date_promise)}</Text></View>
          <View style={{ width: w(3) }}><Text style={styles.text}>พ.ศ.</Text></View>
          <View style={{ width: w(9) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{yearThai(loan_date_promise)}</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ชื่อผู้กู้ */}
        <View style={styles.row}>
          <View style={{ width: w(23) }}><Text style={styles.text}>สัญญากู้ยืมเงินฉบับนี้ ทำขึ้นระหว่าง</Text></View>
          <View style={{ width: w(62) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{loan_customer}</Text></View>
          <View style={{ width: w(3) }}><Text style={styles.text}>อายุ</Text></View>
          <View style={{ width: w(10) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{customer_age || ''}</Text></View>
          <View style={{ width: w(2) }}><Text style={styles.text}>ปี</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ที่อยู่ */}
        <View style={styles.row}>
          <View style={{ width: w(3) }}><Text style={styles.text}>ที่อยู่</Text></View>
          <View style={{ width: w(97) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{customer_address}</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ผู้กู้ */}
        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้กู้"</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ผู้ให้กู้ */}
        <View style={styles.row}>
          <View style={{ width: w(3) }}><Text style={styles.text}>กับ</Text></View>
          <View style={{ width: w(47) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{lender_name}</Text></View>
          <View style={{ width: w(50) }}><Text style={styles.text}>ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้ให้กู้"</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* คำนำ */}
        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>โดยที่คู่สัญญาทั้งสองฝ่ายได้ตกลงกันดังต่อไปนี้</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ข้อ 1 */}
        <View style={styles.row}>
          <View style={{ width: w(2) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(3) }}><Text style={styles.textBold}>ข้อ</Text></View>
          <View style={{ width: w(41) }}><Text style={styles.text}>1.ผู้ให้กู้ตกลงให้ยืม และผู้กู้ตกลงยืมเงินจากผู้ให้กู้เป็นจำนวนเงิน</Text></View>
          <View style={{ width: w(17) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{loan_summary_no_vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>บาท</Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>(</Text></View>
          <View style={{ width: w(30) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{numToThaiBath(loan_summary_no_vat)}</Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>)</Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>โดยผู้กู้ได้รับเงินกู้จำนวนดังกล่าวจากผู้ให้กู้ถูกต้องครบถ้วนในวันทำสัญญานี้แล้ว</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ข้อ 2 */}
        <View style={styles.row}>
          <View style={{ width: w(2) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(3) }}><Text style={styles.textBold}>ข้อ</Text></View>
          <View style={{ width: w(33) }}><Text style={styles.text}>2.ผู้กู้ตกลงชำระดอกเบี้ยให้แก่ผู้ให้กู้ในอัตราร้อยละ</Text></View>
          <View style={{ width: w(8) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{loan_payment_interest} %</Text></View>
          <View style={{ width: w(55) }}><Text style={styles.text}>ต่อปี และต่อไปหากผู้ให้กู้ประสงค์จะเพิ่มอัตราดอกเบี้ยซึ่งไม่เกินไปกว่าอัตรากฎหมาย</Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>กำหนดแล้วผู้กู้ยินยอมให้ผู้ให้กู้เพิ่มอัตราดอกเบี้ยดังกล่าวได้โดยจะไม่โต้แย้งประการใดทั้งสิ้น และจะมีผลบังคับทันทีเมื่อผู้ให้กู้แจ้งอัตราดอกเบี้ยที่กำหนดขึ้น</Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(48) }}><Text style={styles.text}>ใหม่ให้ผู้กู้ทราบเป็นที่เรียบร้อย ซึ่งผู้กู้ตกลงชำระดอกเบี้ยเป็นรายเดือนทุกๆ</Text></View>
          <View style={{ width: w(3) }}><Text style={styles.text}>วันที่</Text></View>
          <View style={{ width: w(6) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{dayThai(loan_installment_date)}</Text></View>
          <View style={{ width: w(22) }}><Text style={styles.text}>ของเดือน เริ่มงวดแรกภายในวันที่</Text></View>
          <View style={{ width: w(21) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{formatThaiDate(firstPaymentDate)}</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ข้อ 3 */}
        <View style={styles.row}>
          <View style={{ width: w(2) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(3) }}><Text style={styles.textBold}>ข้อ</Text></View>
          <View style={{ width: w(65) }}><Text style={styles.text}>3.ผู้กู้ตกลงจะชำระเงินต้นและดอกเบี้ยดังกล่าวในข้อ 1 และ 2 คืนให้แก่ผู้ให้กู้จนครบถ้วนภายใน วันที่</Text></View>
          <View style={{ width: w(29) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{formatThaiDate(lastPaymentDate)}</Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "กำหนดชำระหนี้"</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* ข้อ 4 */}
        <View style={styles.row}>
          <View style={{ width: w(2) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(3) }}><Text style={styles.textBold}>ข้อ</Text></View>
          <View style={{ width: w(94) }}><Text style={styles.text}>4.หากผู้กู้ปฎิบัติผิดกำหนดชำระหนี้หรือผิดสัญญาในข้อหนึ่งข้อใดแห่งสัญญานี้ผู้กู้ยินยอมรับผิด และชำระหนี้เงินกู้และดอกเบี้ย พร้อมค่าเสียหายอื่นๆ</Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>ที่ผู้ให้กู้จะพึงได้รับอันเนื่องมาจากการบังคับให้ผู้กู้ชำระหนี้ตามสัญญานี้</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* หมายเหตุ */}
        <View style={styles.row}>
          <View style={{ width: w(7) }}><Text style={styles.text}>หมายเหตุ</Text></View>
          <View style={{ width: w(93) }}><Text style={[styles.text, styles.underline, styles.centerText]}>{note}</Text></View>
        </View>
        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
        </View>
        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(100) }}><Text style={styles.text}>ผู้กู้ได้เข้าใจข้อความในหนังสือสัญญานี้โดยตลอดแล้ว จึงได้ลงลายมือชื่อไว้สำคัญต่อหน้าพยาน</Text></View>
        </View>
        <View style={{ height: 10 }} />

        {/* ลายเซ็นผู้กู้และผู้ให้กู้ */}
        <View style={styles.row}>
          <View style={{ width: w(12) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>ลงชื่อ</Text></View>
          <View style={{ width: w(25) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>ผู้กู้</Text></View>
          <View style={{ width: w(12) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>ลงชื่อ</Text></View>
          <View style={{ width: w(25) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>ผู้ให้กู้</Text></View>
          <View style={{ width: w(10) }}><Text style={styles.text}> </Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(15) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>(</Text></View>
          <View style={{ width: w(25) }}><Text style={styles.text}>..............................................................</Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>)</Text></View>
          <View style={{ width: w(18) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>(</Text></View>
          <View style={{ width: w(25) }}><Text style={styles.text}>..............................................................</Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>)</Text></View>
          <View style={{ width: w(13) }}><Text style={styles.text}> </Text></View>
        </View>
        <View style={{ height: 10 }} />

        {/* ลายเซ็นพยาน */}
        <View style={styles.row}>
          <View style={{ width: w(12) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>ลงชื่อ</Text></View>
          <View style={{ width: w(25) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>พยาน</Text></View>
          <View style={{ width: w(12) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>ลงชื่อ</Text></View>
          <View style={{ width: w(25) }}><Text style={[styles.text, styles.underline, styles.centerText]}> </Text></View>
          <View style={{ width: w(4) }}><Text style={styles.text}>พยาน</Text></View>
          <View style={{ width: w(10) }}><Text style={styles.text}> </Text></View>
        </View>
        <View style={{ height: 6 }} />

        <View style={styles.row}>
          <View style={{ width: w(15) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>(</Text></View>
          <View style={{ width: w(25) }}><Text style={styles.text}>..............................................................</Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>)</Text></View>
          <View style={{ width: w(18) }}><Text style={styles.text}> </Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>(</Text></View>
          <View style={{ width: w(25) }}><Text style={styles.text}>..............................................................</Text></View>
          <View style={{ width: w(1) }}><Text style={styles.text}>)</Text></View>
          <View style={{ width: w(13) }}><Text style={styles.text}> </Text></View>
        </View>
      </Page>
    </Document>
  );
};

// ============================================
// INSTALLMENT SCHEDULE PDF
// ============================================

const scheduleStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: THAI_FONT,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  text: {
    fontSize: 13,
  },
  underline: {
    borderBottomWidth: 0.5,
    borderBottomStyle: 'dotted',
    borderBottomColor: '#000',
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000',
    padding: 5,
  },
  tableCell: {
    fontSize: 12,
    textAlign: 'center',
  },
  tableCellRight: {
    fontSize: 12,
    textAlign: 'right',
    paddingRight: 5,
  },
});

export const InstallmentSchedulePDF: React.FC<{
  loan: LoanData;
  installments: InstallmentData[];
}> = ({ loan, installments }) => {
  const {
    loan_customer,
    loan_employee,
    loan_date_promise,
    loan_summary_no_vat,
    loan_payment_interest,
    loan_payment_year_counter,
    loan_payment_month,
    loan_installment_date,
    customer_address = '',
    customer_phone = '',
    branch = '',
  } = loan;

  const totalInstallments = loan_payment_year_counter * 12;

  return (
    <Document>
      <Page size="A4" style={scheduleStyles.page}>
        <View style={{ height: 25 }} />
        
        {/* Header */}
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold' }}>ตารางการผ่อนชำระ</Text>
        </View>
        <View style={{ height: 10 }} />

        {/* Customer and Employee Info */}
        <View style={scheduleStyles.row}>
          <View style={{ width: '4%' }}><Text style={scheduleStyles.text}>ชื่อผู้กู้</Text></View>
          <View style={{ width: '46%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{loan_customer}</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '7%' }}><Text style={scheduleStyles.text}>เจ้าหน้าที่</Text></View>
          <View style={{ width: '40%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{loan_employee}</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* Address and Branch */}
        <View style={scheduleStyles.row}>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}>ที่อยู่</Text></View>
          <View style={{ width: '47%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{customer_address}</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '4%' }}><Text style={scheduleStyles.text}>สาขา</Text></View>
          <View style={{ width: '43%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{branch}</Text></View>
        </View>
        <View style={{ height: 6 }} />

        {/* Phone and Loan Date */}
        <View style={scheduleStyles.row}>
          <View style={{ width: '9%' }}><Text style={scheduleStyles.text}>เบอร์โทรศัพท์</Text></View>
          <View style={{ width: '41%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{customer_phone}</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '11%' }}><Text style={scheduleStyles.text}>วันที่ออกสินเชื่อ</Text></View>
          <View style={{ width: '36%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{formatThaiDate(loan_date_promise)}</Text></View>
        </View>
        <View style={{ height: 13 }} />

        {/* Loan Details Row 1 */}
        <View style={scheduleStyles.row}>
          <View style={{ width: '5%' }}><Text style={scheduleStyles.text}>วงเงินกู้</Text></View>
          <View style={{ width: '11%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{loan_summary_no_vat.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}>บาท</Text></View>
          <View style={{ width: '1%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '9%' }}><Text style={scheduleStyles.text}>อัตราดอกเบี้ย</Text></View>
          <View style={{ width: '8%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{loan_payment_interest} %</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}>ต่อปี</Text></View>
          <View style={{ width: '1%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '10%' }}><Text style={scheduleStyles.text}>ระยะเวลาชำระ</Text></View>
          <View style={{ width: '5%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{totalInstallments}</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}>งวด</Text></View>
          <View style={{ width: '1%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '5%' }}><Text style={scheduleStyles.text}>งวดละ</Text></View>
          <View style={{ width: '10%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{loan_payment_month.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
          <View style={{ width: '3%' }}><Text style={scheduleStyles.text}>บาท</Text></View>
          <View style={{ width: '1%' }}><Text style={scheduleStyles.text}> </Text></View>
          <View style={{ width: '9%' }}><Text style={scheduleStyles.text}>ชำระทุกวันที่</Text></View>
          <View style={{ width: '4%' }}><Text style={[scheduleStyles.text, scheduleStyles.underline, { textAlign: 'center' }]}>{dayThai(loan_installment_date)}</Text></View>
          <View style={{ width: '9%' }}><Text style={scheduleStyles.text}>ของทุกเดือน</Text></View>
        </View>
        <View style={{ height: 13 }} />

        {/* Installment Table */}
        <View style={scheduleStyles.table}>
          {/* Table Header */}
          <View style={scheduleStyles.tableHeader}>
            <View style={{ width: '8%' }}><Text style={[scheduleStyles.tableCell, { fontWeight: 'bold' }]}>งวด</Text></View>
            <View style={{ width: '17%' }}><Text style={[scheduleStyles.tableCell, { fontWeight: 'bold' }]}>วันที่ชำระ</Text></View>
            <View style={{ width: '20%' }}><Text style={[scheduleStyles.tableCell, { fontWeight: 'bold' }]}>ผู้ชำระ</Text></View>
            <View style={{ width: '20%' }}><Text style={[scheduleStyles.tableCell, { fontWeight: 'bold' }]}>ผู้รับชำระ</Text></View>
            <View style={{ width: '18%' }}><Text style={[scheduleStyles.tableCell, { fontWeight: 'bold' }]}>ยอดชำระ (ต่อเดือน)</Text></View>
            <View style={{ width: '17%' }}><Text style={[scheduleStyles.tableCell, { fontWeight: 'bold' }]}>ยอดค้างชำระคงเหลือ</Text></View>
          </View>

          {/* Table Rows */}
          {installments.map((installment, index) => (
            <View key={index} style={scheduleStyles.tableRow}>
              <View style={{ width: '8%' }}><Text style={scheduleStyles.tableCell}>{installment.loan_payment_installment}</Text></View>
              <View style={{ width: '17%' }}><Text style={scheduleStyles.tableCell}>{installment.loan_payment_date}</Text></View>
              <View style={{ width: '20%' }}><Text style={scheduleStyles.tableCell}>{installment.loan_payment_customer}</Text></View>
              <View style={{ width: '20%' }}><Text style={scheduleStyles.tableCell}>{installment.loan_employee}</Text></View>
              <View style={{ width: '18%' }}><Text style={scheduleStyles.tableCellRight}>{installment.loan_payment_amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
              <View style={{ width: '17%' }}><Text style={scheduleStyles.tableCellRight}>{installment.loan_balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default LoanContractPDF;
