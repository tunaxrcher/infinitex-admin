/**
 * Installment Schedule PDF Template
 * ตารางการผ่อนชำระ
 */

import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { THAI_FONT } from './fonts';
import { EmptyTH, Spacer, TH, TR } from './table-helpers';
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
        <Spacer size={25} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>ตารางการผ่อนชำระ</Text>
        </View>
        <Spacer size={10} />

        {/* Customer and Employee Info */}
        <TR>
          <TH width={4}>ชื่อผู้กู้</TH>
          <TH width={46} align="center" underline>
            {loan_customer}
          </TH>
          <EmptyTH width={3} />
          <TH width={7}>เจ้าหน้าที่</TH>
          <TH width={40} align="center" underline>
            {loan_employee}
          </TH>
        </TR>
        <Spacer />

        {/* Address and Branch */}
        <TR>
          <TH width={3}>ที่อยู่</TH>
          <TH width={47} align="center" underline>
            {customer_address}
          </TH>
          <EmptyTH width={3} />
          <TH width={4}>สาขา</TH>
          <TH width={43} align="center" underline>
            {branch}
          </TH>
        </TR>
        <Spacer />

        {/* Phone and Loan Date */}
        <TR>
          <TH width={9}>เบอร์โทรศัพท์</TH>
          <TH width={41} align="center" underline>
            {customer_phone}
          </TH>
          <EmptyTH width={3} />
          <TH width={11}>วันที่ออกสินเชื่อ</TH>
          <TH width={36} align="center" underline>
            {formatThaiDate(loan_date_promise)}
          </TH>
        </TR>
        <Spacer size={13} />

        {/* Loan Details Row */}
        <TR>
          <TH width={5}>วงเงินกู้</TH>
          <TH width={11} align="center" underline>
            {loan_summary_no_vat.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}
          </TH>
          <TH width={3}>บาท</TH>
          <EmptyTH width={1} />
          <TH width={9}>อัตราดอกเบี้ย</TH>
          <TH width={8} align="center" underline>
            {loan_payment_interest} %
          </TH>
          <TH width={3}>ต่อปี</TH>
          <EmptyTH width={1} />
          <TH width={10}>ระยะเวลาชำระ</TH>
          <TH width={5} align="center" underline>
            {totalInstallments}
          </TH>
          <TH width={3}>งวด</TH>
          <EmptyTH width={1} />
          <TH width={5}>งวดละ</TH>
          <TH width={10} align="center" underline>
            {loan_payment_month.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}
          </TH>
          <TH width={3}>บาท</TH>
          <EmptyTH width={1} />
          <TH width={9}>ชำระทุกวันที่</TH>
          <TH width={4} align="center" underline>
            {dayThai(loan_installment_date)}
          </TH>
          <TH width={9}>ของทุกเดือน</TH>
        </TR>
        <Spacer size={13} />

        {/* Installment Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={{ width: '8%' }}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>
                งวด
              </Text>
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
