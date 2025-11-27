/**
 * Installment Schedule PDF Template
 * ตารางการผ่อนชำระ
 */

import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { THAI_FONT } from './fonts';
import { dayThai, formatThaiDate } from './thai-date';

// ============================================
// TYPES
// ============================================

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
// STYLES
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: THAI_FONT,
    fontSize: 12,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  text: {
    fontSize: 12,
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

// ============================================
// COMPONENT
// ============================================

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
      <Page size="A4" style={styles.page}>
        <View style={{ height: 25 }} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>ตารางการผ่อนชำระ</Text>
        </View>
        <View style={{ height: 10 }} />

        {/* Customer and Employee Info */}
        <View style={styles.row}>
          <View style={{ width: '4%' }}>
            <Text style={styles.text}>ชื่อผู้กู้</Text>
          </View>
          <View style={{ width: '46%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {loan_customer}
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '7%' }}>
            <Text style={styles.text}>เจ้าหน้าที่</Text>
          </View>
          <View style={{ width: '40%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {loan_employee}
            </Text>
          </View>
        </View>
        <View style={{ height: 6 }} />

        {/* Address and Branch */}
        <View style={styles.row}>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}>ที่อยู่</Text>
          </View>
          <View style={{ width: '47%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {customer_address}
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '4%' }}>
            <Text style={styles.text}>สาขา</Text>
          </View>
          <View style={{ width: '43%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {branch}
            </Text>
          </View>
        </View>
        <View style={{ height: 6 }} />

        {/* Phone and Loan Date */}
        <View style={styles.row}>
          <View style={{ width: '9%' }}>
            <Text style={styles.text}>เบอร์โทรศัพท์</Text>
          </View>
          <View style={{ width: '41%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {customer_phone}
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '11%' }}>
            <Text style={styles.text}>วันที่ออกสินเชื่อ</Text>
          </View>
          <View style={{ width: '36%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {formatThaiDate(loan_date_promise)}
            </Text>
          </View>
        </View>
        <View style={{ height: 13 }} />

        {/* Loan Details Row */}
        <View style={styles.row}>
          <View style={{ width: '5%' }}>
            <Text style={styles.text}>วงเงินกู้</Text>
          </View>
          <View style={{ width: '11%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {loan_summary_no_vat.toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}>บาท</Text>
          </View>
          <View style={{ width: '1%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '9%' }}>
            <Text style={styles.text}>อัตราดอกเบี้ย</Text>
          </View>
          <View style={{ width: '8%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {loan_payment_interest} %
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}>ต่อปี</Text>
          </View>
          <View style={{ width: '1%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '10%' }}>
            <Text style={styles.text}>ระยะเวลาชำระ</Text>
          </View>
          <View style={{ width: '5%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {totalInstallments}
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}>งวด</Text>
          </View>
          <View style={{ width: '1%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '5%' }}>
            <Text style={styles.text}>งวดละ</Text>
          </View>
          <View style={{ width: '10%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {loan_payment_month.toLocaleString('th-TH', {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={{ width: '3%' }}>
            <Text style={styles.text}>บาท</Text>
          </View>
          <View style={{ width: '1%' }}>
            <Text style={styles.text}> </Text>
          </View>
          <View style={{ width: '9%' }}>
            <Text style={styles.text}>ชำระทุกวันที่</Text>
          </View>
          <View style={{ width: '4%' }}>
            <Text style={[styles.text, styles.underline, { textAlign: 'center' }]}>
              {dayThai(loan_installment_date)}
            </Text>
          </View>
          <View style={{ width: '9%' }}>
            <Text style={styles.text}>ของทุกเดือน</Text>
          </View>
        </View>
        <View style={{ height: 13 }} />

        {/* Installment Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={{ width: '8%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>งวด</Text>
            </View>
            <View style={{ width: '17%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                วันที่ชำระ
              </Text>
            </View>
            <View style={{ width: '20%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                ผู้ชำระ
              </Text>
            </View>
            <View style={{ width: '20%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                ผู้รับชำระ
              </Text>
            </View>
            <View style={{ width: '18%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                ยอดชำระ (ต่อเดือน)
              </Text>
            </View>
            <View style={{ width: '17%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                ยอดค้างชำระคงเหลือ
              </Text>
            </View>
          </View>

          {/* Table Rows */}
          {installments.map((installment, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={{ width: '8%' }}>
                <Text style={styles.tableCell}>
                  {installment.loan_payment_installment}
                </Text>
              </View>
              <View style={{ width: '17%' }}>
                <Text style={styles.tableCell}>
                  {installment.loan_payment_date}
                </Text>
              </View>
              <View style={{ width: '20%' }}>
                <Text style={styles.tableCell}>
                  {installment.loan_payment_customer}
                </Text>
              </View>
              <View style={{ width: '20%' }}>
                <Text style={styles.tableCell}>
                  {installment.loan_employee}
                </Text>
              </View>
              <View style={{ width: '18%' }}>
                <Text style={styles.tableCellRight}>
                  {installment.loan_payment_amount.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <View style={{ width: '17%' }}>
                <Text style={styles.tableCellRight}>
                  {installment.loan_balance.toLocaleString('th-TH', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default InstallmentSchedulePDF;

