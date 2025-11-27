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
// STYLES
// ============================================

const contractStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: THAI_FONT,
    fontSize: 13,
  },
  header: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  spacer: {
    height: 6,
  },
  spacerLarge: {
    height: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
  },
  underline: {
    borderBottom: '1 dotted #000',
    textAlign: 'center',
    minWidth: 50,
    paddingBottom: 2,
  },
  bold: {
    fontWeight: 'bold',
  },
  indent: {
    marginLeft: 20,
  },
  signatureSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    alignItems: 'center',
    width: '40%',
  },
  signatureLine: {
    borderBottom: '1 dotted #000',
    width: '100%',
    marginVertical: 5,
  },
});

const scheduleStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: THAI_FONT,
    fontSize: 13,
  },
  header: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  spacer: {
    height: 6,
  },
  spacerLarge: {
    height: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
  },
  underline: {
    borderBottom: '1 dotted #000',
    textAlign: 'center',
    paddingBottom: 2,
    flex: 1,
    marginHorizontal: 5,
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
  col1: { width: '8%' },
  col2: { width: '17%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  col5: { width: '18%' },
  col6: { width: '17%' },
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
      <Page size="A4" style={contractStyles.page}>
        <View style={contractStyles.spacerLarge} />
        <Text style={contractStyles.header}>หนังสือสัญญากู้เงิน</Text>
        <View style={contractStyles.spacerLarge} />

        <View style={contractStyles.row}>
          <Text style={{ flex: 1 }}></Text>
          <Text>สัญญาทำขึ้นที่</Text>
          <Text
            style={[
              contractStyles.underline,
              { width: 150, marginHorizontal: 5 },
            ]}
          ></Text>
        </View>
        <View style={contractStyles.spacer} />

        <View style={contractStyles.row}>
          <Text style={{ flex: 1 }}></Text>
          <Text>วัน</Text>
          <Text
            style={[
              contractStyles.underline,
              { width: 50, marginHorizontal: 5 },
            ]}
          >
            {dayThai(loan_date_promise)}
          </Text>
          <Text>เดือน</Text>
          <Text
            style={[
              contractStyles.underline,
              { width: 100, marginHorizontal: 5 },
            ]}
          >
            {monthThai(loan_date_promise)}
          </Text>
          <Text>พ.ศ.</Text>
          <Text
            style={[
              contractStyles.underline,
              { width: 60, marginHorizontal: 5 },
            ]}
          >
            {yearThai(loan_date_promise)}
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <View style={contractStyles.row}>
          <Text>สัญญากู้ยืมเงินฉบับนี้ ทำขึ้นระหว่าง</Text>
          <Text
            style={[contractStyles.underline, { flex: 1, marginHorizontal: 5 }]}
          >
            {loan_customer}
          </Text>
          <Text>อายุ</Text>
          <Text
            style={[
              contractStyles.underline,
              { width: 50, marginHorizontal: 5 },
            ]}
          >
            {customer_age || ''}
          </Text>
          <Text>ปี</Text>
        </View>
        <View style={contractStyles.spacer} />

        <View style={contractStyles.row}>
          <Text>ที่อยู่</Text>
          <Text style={[contractStyles.underline, { flex: 1, marginLeft: 5 }]}>
            {customer_address}
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <Text>ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้กู้"</Text>
        <View style={contractStyles.spacer} />

        <View style={contractStyles.row}>
          <Text>กับ</Text>
          <Text
            style={[
              contractStyles.underline,
              { width: 250, marginHorizontal: 5 },
            ]}
          >
            {lender_name}
          </Text>
          <Text style={{ flex: 1 }}>
            ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้ให้กู้"
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <Text>โดยที่คู่สัญญาทั้งสองฝ่ายได้ตกลงกันดังต่อไปนี้</Text>
        <View style={contractStyles.spacer} />

        <View style={[contractStyles.row, contractStyles.indent]}>
          <Text style={contractStyles.bold}>ข้อ 1.</Text>
          <Text style={{ marginLeft: 5 }}>
            ผู้ให้กู้ตกลงให้ยืม และผู้กู้ตกลงยืมเงินจากผู้ให้กู้เป็นจำนวนเงิน
          </Text>
          <Text style={[contractStyles.underline, { marginHorizontal: 5 }]}>
            {loan_summary_no_vat.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          <Text>บาท</Text>
          <Text style={{ marginLeft: 40 }}>(</Text>
          <Text style={[contractStyles.underline, { flex: 1 }]}>
            {numToThaiBath(loan_summary_no_vat)}
          </Text>
          <Text>)</Text>
        </View>
    
        <View style={contractStyles.spacer} />

        <Text>
          โดยผู้กู้ได้รับเงินกู้จำนวนดังกล่าวจากผู้ให้กู้ถูกต้องครบถ้วนในวันทำสัญญานี้แล้ว
        </Text>
        <View style={contractStyles.spacer} />

        <View style={[contractStyles.row, contractStyles.indent]}>
          <Text style={contractStyles.bold}>ข้อ 2.</Text>
          <Text style={{ marginLeft: 5 }}>
            ผู้กู้ตกลงชำระดอกเบี้ยให้แก่ผู้ให้กู้ในอัตราร้อยละ
          </Text>
          <Text style={[contractStyles.underline, { marginHorizontal: 5 }]}>
            {loan_payment_interest} %
          </Text>
          <Text>
            ต่อปี
            และต่อไปหากผู้ให้กู้ประสงค์จะเพิ่มอัตราดอกเบี้ยซึ่งไม่เกินไปกว่าอัตรากฎหมาย
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <Text>
          กำหนดแล้วผู้กู้ยินยอมให้ผู้ให้กู้เพิ่มอัตราดอกเบี้ยดังกล่าวได้โดยจะไม่โต้แย้งประการใดทั้งสิ้น
          และจะมีผลบังคับทันทีเมื่อผู้ให้กู้แจ้งอัตราดอกเบี้ยที่กำหนดขึ้น
        </Text>
        <View style={contractStyles.spacer} />

        <View style={contractStyles.row}>
          <Text>
            ใหม่ให้ผู้กู้ทราบเป็นที่เรียบร้อย
            ซึ่งผู้กู้ตกลงชำระดอกเบี้ยเป็นรายเดือนทุกๆ วันที่
          </Text>
          <Text style={[contractStyles.underline, { marginHorizontal: 5 }]}>
            {dayThai(loan_installment_date)}
          </Text>
          <Text>ของเดือน เริ่มงวดแรกภายในวันที่</Text>
          <Text style={[contractStyles.underline, { marginLeft: 5 }]}>
            {formatThaiDate(firstPaymentDate)}
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <View style={[contractStyles.row, contractStyles.indent]}>
          <Text style={contractStyles.bold}>ข้อ 3.</Text>
          <Text style={{ marginLeft: 5 }}>
            ผู้กู้ตกลงจะชำระเงินต้นและดอกเบี้ยดังกล่าวในข้อ 1 และ 2
            คืนให้แก่ผู้ให้กู้จนครบถ้วนภายใน วันที่
          </Text>
          <Text style={[contractStyles.underline, { marginLeft: 5 }]}>
            {formatThaiDate(lastPaymentDate)}
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <Text>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "กำหนดชำระหนี้"</Text>
        <View style={contractStyles.spacer} />

        <View style={[contractStyles.row, contractStyles.indent]}>
          <Text style={contractStyles.bold}>ข้อ 4.</Text>
          <Text style={{ marginLeft: 5, flex: 1 }}>
            หากผู้กู้ปฎิบัติผิดกำหนดชำระหนี้หรือผิดสัญญาในข้อหนึ่งข้อใดแห่งสัญญานี้ผู้กู้ยินยอมรับผิด
            และชำระหนี้เงินกู้และดอกเบี้ย พร้อมค่าเสียหายอื่นๆ
          </Text>
        </View>
        <View style={contractStyles.spacer} />

        <Text>
          ที่ผู้ให้กู้จะพึงได้รับอันเนื่องมาจากการบังคับให้ผู้กู้ชำระหนี้ตามสัญญานี้
        </Text>
        <View style={contractStyles.spacer} />

        <View style={contractStyles.row}>
          <Text>หมายเหตุ</Text>
          <Text style={[contractStyles.underline, { flex: 1, marginLeft: 5 }]}>
            {note}
          </Text>
        </View>
        <Text
          style={[contractStyles.underline, { width: '100%', marginTop: 3 }]}
        ></Text>
        <Text
          style={[contractStyles.underline, { width: '100%', marginTop: 3 }]}
        ></Text>
        <View style={contractStyles.spacer} />

        <Text>
          ผู้กู้ได้เข้าใจข้อความในหนังสือสัญญานี้โดยตลอดแล้ว
          จึงได้ลงลายมือชื่อไว้สำคัญต่อหน้าพยาน
        </Text>
        <View style={contractStyles.spacerLarge} />

        <View style={contractStyles.signatureSection}>
          <View style={contractStyles.signatureBox}>
            <Text>ลงชื่อ</Text>
            <View style={[contractStyles.signatureLine, { marginTop: 10 }]} />
            <Text>({loan_customer})</Text>
            <Text>ผู้กู้</Text>
          </View>
          <View style={contractStyles.signatureBox}>
            <Text>ลงชื่อ</Text>
            <View style={[contractStyles.signatureLine, { marginTop: 10 }]} />
            <Text>({lender_name})</Text>
            <Text>ผู้ให้กู้</Text>
          </View>
        </View>

        <View style={[contractStyles.signatureSection, { marginTop: 20 }]}>
          <View style={contractStyles.signatureBox}>
            <Text>ลงชื่อ</Text>
            <View style={[contractStyles.signatureLine, { marginTop: 10 }]} />
            <Text>(..................................................)</Text>
            <Text>พยาน</Text>
          </View>
          <View style={contractStyles.signatureBox}>
            <Text>ลงชื่อ</Text>
            <View style={[contractStyles.signatureLine, { marginTop: 10 }]} />
            <Text>(..................................................)</Text>
            <Text>พยาน</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// ============================================
// INSTALLMENT SCHEDULE PDF
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
      <Page size="A4" style={scheduleStyles.page}>
        <View style={scheduleStyles.spacerLarge} />
        <Text style={scheduleStyles.header}>ตารางการผ่อนชำระ</Text>
        <View style={scheduleStyles.spacerLarge} />

        <View style={scheduleStyles.infoRow}>
          <Text style={scheduleStyles.label}>ชื่อผู้กู้</Text>
          <Text style={[scheduleStyles.underline, { width: 250 }]}>
            {loan_customer}
          </Text>
          <View style={{ width: 20 }} />
          <Text style={scheduleStyles.label}>เจ้าหน้าที่</Text>
          <Text style={[scheduleStyles.underline, { width: 220 }]}>
            {loan_employee}
          </Text>
        </View>

        <View style={scheduleStyles.infoRow}>
          <Text style={scheduleStyles.label}>ที่อยู่</Text>
          <Text style={[scheduleStyles.underline, { width: 250 }]}>
            {customer_address}
          </Text>
          <View style={{ width: 20 }} />
          <Text style={scheduleStyles.label}>สาขา</Text>
          <Text style={[scheduleStyles.underline, { width: 220 }]}>
            {branch}
          </Text>
        </View>

        <View style={scheduleStyles.infoRow}>
          <Text style={scheduleStyles.label}>เบอร์โทรศัพท์</Text>
          <Text style={[scheduleStyles.underline, { width: 220 }]}>
            {customer_phone}
          </Text>
          <View style={{ width: 20 }} />
          <Text style={scheduleStyles.label}>วันที่ออกสินเชื่อ</Text>
          <Text style={[scheduleStyles.underline, { width: 220 }]}>
            {formatThaiDate(loan_date_promise)}
          </Text>
        </View>

        <View style={scheduleStyles.spacerLarge} />

        <View style={scheduleStyles.row}>
          <Text style={scheduleStyles.label}>วงเงินกู้</Text>
          <Text
            style={[
              scheduleStyles.underline,
              { width: 80, marginHorizontal: 5 },
            ]}
          >
            {loan_summary_no_vat.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text>บาท</Text>
          <View style={{ width: 10 }} />
          <Text style={scheduleStyles.label}>อัตราดอกเบี้ย</Text>
          <Text
            style={[
              scheduleStyles.underline,
              { width: 50, marginHorizontal: 5 },
            ]}
          >
            {loan_payment_interest} %
          </Text>
          <Text>ต่อปี</Text>
          <View style={{ width: 10 }} />
          <Text style={scheduleStyles.label}>ระยะเวลาชำระ</Text>
          <Text
            style={[
              scheduleStyles.underline,
              { width: 40, marginHorizontal: 5 },
            ]}
          >
            {totalInstallments}
          </Text>
          <Text>งวด</Text>
        </View>

        <View style={[scheduleStyles.row, { marginTop: 6 }]}>
          <Text style={scheduleStyles.label}>งวดละ</Text>
          <Text
            style={[
              scheduleStyles.underline,
              { width: 80, marginHorizontal: 5 },
            ]}
          >
            {loan_payment_month.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}
          </Text>
          <Text>บาท</Text>
          <View style={{ width: 10 }} />
          <Text style={scheduleStyles.label}>ชำระทุกวันที่</Text>
          <Text
            style={[
              scheduleStyles.underline,
              { width: 40, marginHorizontal: 5 },
            ]}
          >
            {dayThai(loan_installment_date)}
          </Text>
          <Text>ของทุกเดือน</Text>
        </View>

        <View style={scheduleStyles.spacerLarge} />

        <View style={scheduleStyles.table}>
          <View style={scheduleStyles.tableHeader}>
            <Text style={[scheduleStyles.tableCell, scheduleStyles.col1]}>
              งวด
            </Text>
            <Text style={[scheduleStyles.tableCell, scheduleStyles.col2]}>
              วันที่ชำระ
            </Text>
            <Text style={[scheduleStyles.tableCell, scheduleStyles.col3]}>
              ผู้ชำระ
            </Text>
            <Text style={[scheduleStyles.tableCell, scheduleStyles.col4]}>
              ผู้รับชำระ
            </Text>
            <Text style={[scheduleStyles.tableCell, scheduleStyles.col5]}>
              ยอดชำระ (ต่อเดือน)
            </Text>
            <Text style={[scheduleStyles.tableCell, scheduleStyles.col6]}>
              ยอดค้างชำระคงเหลือ
            </Text>
          </View>

          {installments.map((installment, index) => (
            <View key={index} style={scheduleStyles.tableRow}>
              <Text style={[scheduleStyles.tableCell, scheduleStyles.col1]}>
                {installment.loan_payment_installment}
              </Text>
              <Text style={[scheduleStyles.tableCell, scheduleStyles.col2]}>
                {installment.loan_payment_date}
              </Text>
              <Text style={[scheduleStyles.tableCell, scheduleStyles.col3]}>
                {installment.loan_payment_customer}
              </Text>
              <Text style={[scheduleStyles.tableCell, scheduleStyles.col4]}>
                {installment.loan_employee}
              </Text>
              <Text
                style={[scheduleStyles.tableCellRight, scheduleStyles.col5]}
              >
                {installment.loan_payment_amount.toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text
                style={[scheduleStyles.tableCellRight, scheduleStyles.col6]}
              >
                {installment.loan_balance.toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
