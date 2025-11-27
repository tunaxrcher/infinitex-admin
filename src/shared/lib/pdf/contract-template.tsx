/**
 * Loan Contract PDF Template
 * หนังสือสัญญากู้เงิน
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
import { TR, TH, EmptyTH, Spacer } from './table-helpers';

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

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
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
});

// ============================================
// COMPONENT
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
        <Spacer size={25} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>หนังสือสัญญากู้เงิน</Text>
        </View>
        <Spacer size={10} />

        {/* สัญญาทำขึ้นที่ */}
        <TR>
          <EmptyTH width={55} />
          <TH width={10}>สัญญาทำขึ้นที่</TH>
          <TH width={35} align="center" underline />
        </TR>
        <Spacer />

        {/* วันที่ */}
        <TR>
          <EmptyTH width={55} />
          <TH width={2}>วัน</TH>
          <TH width={8} align="center" underline>
            {dayThai(loan_date_promise)}
          </TH>
          <TH width={4}>เดือน</TH>
          <TH width={19} align="center" underline>
            {monthThai(loan_date_promise)}
          </TH>
          <TH width={3}>พ.ศ.</TH>
          <TH width={9} align="center" underline>
            {yearThai(loan_date_promise)}
          </TH>
        </TR>
        <Spacer />

        {/* ชื่อผู้กู้ */}
        <TR>
          <TH width={23}>สัญญากู้ยืมเงินฉบับนี้ ทำขึ้นระหว่าง</TH>
          <TH width={62} align="center" underline>
            {loan_customer}
          </TH>
          <TH width={3}>อายุ</TH>
          <TH width={10} align="center" underline>
            {customer_age || ''}
          </TH>
          <TH width={2}>ปี</TH>
        </TR>
        <Spacer />

        {/* ที่อยู่ */}
        <TR>
          <TH width={3}>ที่อยู่</TH>
          <TH width={97} align="center" underline>
            {customer_address}
          </TH>
        </TR>
        <Spacer />

        {/* ผู้กู้ */}
        <TR>
          <TH width={100}>ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้กู้"</TH>
        </TR>
        <Spacer />

        {/* ผู้ให้กู้ */}
        <TR>
          <TH width={3}>กับ</TH>
          <TH width={47} align="center" underline>
            {lender_name}
          </TH>
          <TH width={50}>ซึ่งต่อไปในสัญญานี้ จะเรียกว่า "ผู้ให้กู้"</TH>
        </TR>
        <Spacer />

        {/* คำนำ */}
        <TR>
          <TH width={100}>โดยที่คู่สัญญาทั้งสองฝ่ายได้ตกลงกันดังต่อไปนี้</TH>
        </TR>
        <Spacer />

        {/* ข้อ 1 */}
        <TR>
          <EmptyTH width={2} />
          <TH width={3} bold>
            ข้อ
          </TH>
          <TH width={41}>
            1.ผู้ให้กู้ตกลงให้ยืม และผู้กู้ตกลงยืมเงินจากผู้ให้กู้เป็นจำนวนเงิน
          </TH>
          <TH width={17} align="center" underline>
            {loan_summary_no_vat.toLocaleString('th-TH', {
              minimumFractionDigits: 2,
            })}
          </TH>
          <TH width={4}>บาท</TH>
          <TH width={1}>(</TH>
          <TH width={30} align="center" underline>
            {numToThaiBath(loan_summary_no_vat)}
          </TH>
          <TH width={1}>)</TH>
        </TR>
        <Spacer />

        <TR>
          <TH width={100}>
            โดยผู้กู้ได้รับเงินกู้จำนวนดังกล่าวจากผู้ให้กู้ถูกต้องครบถ้วนในวันทำสัญญานี้แล้ว
          </TH>
        </TR>
        <Spacer />

        {/* ข้อ 2 */}
        <TR>
          <EmptyTH width={2} />
          <TH width={3} bold>
            ข้อ
          </TH>
          <TH width={33}>2.ผู้กู้ตกลงชำระดอกเบี้ยให้แก่ผู้ให้กู้ในอัตราร้อยละ</TH>
          <TH width={8} align="center" underline>
            {loan_payment_interest} %
          </TH>
          <TH width={54}>
            ต่อปี และต่อไปหากผู้ให้กู้ประสงค์จะเพิ่มอัตราดอกเบี้ยซึ่งไม่เกินไปกว่าอัตรากฎหมาย
          </TH>
        </TR>
        <Spacer />

        <TR>
          <TH width={100}>
            กำหนดแล้วผู้กู้ยินยอมให้ผู้ให้กู้เพิ่มอัตราดอกเบี้ยดังกล่าวได้โดยจะไม่โต้แย้งประการใดทั้งสิ้น
            และจะมีผลบังคับทันทีเมื่อผู้ให้กู้แจ้งอัตราดอกเบี้ยที่กำหนดขึ้น
          </TH>
        </TR>
        <Spacer />

        <TR>
          <TH width={48}>
            ใหม่ให้ผู้กู้ทราบเป็นที่เรียบร้อย
            ซึ่งผู้กู้ตกลงชำระดอกเบี้ยเป็นรายเดือนทุกๆ
          </TH>
          <TH width={3}>วันที่</TH>
          <TH width={6} align="center" underline>
            {dayThai(loan_installment_date)}
          </TH>
          <TH width={22}>ของเดือน เริ่มงวดแรกภายในวันที่</TH>
          <TH width={21} align="center" underline>
            {formatThaiDate(firstPaymentDate)}
          </TH>
        </TR>
        <Spacer />

        {/* ข้อ 3 */}
        <TR>
          <EmptyTH width={2} />
          <TH width={3} bold>
            ข้อ
          </TH>
          <TH width={65}>
            3.ผู้กู้ตกลงจะชำระเงินต้นและดอกเบี้ยดังกล่าวในข้อ 1 และ 2
            คืนให้แก่ผู้ให้กู้จนครบถ้วนภายใน วันที่
          </TH>
          <TH width={29} align="center" underline>
            {formatThaiDate(lastPaymentDate)}
          </TH>
        </TR>
        <Spacer />

        <TR>
          <TH width={100}>ซึ่งต่อไปในสัญญานี้จะเรียกว่า "กำหนดชำระหนี้"</TH>
        </TR>
        <Spacer />

        {/* ข้อ 4 */}
        <TR>
          <EmptyTH width={2} />
          <TH width={3} bold>
            ข้อ
          </TH>
          <TH width={95}>
            4.หากผู้กู้ปฎิบัติผิดกำหนดชำระหนี้หรือผิดสัญญาในข้อหนึ่งข้อใดแห่งสัญญานี้ผู้กู้ยินยอมรับผิด
            และชำระหนี้เงินกู้และดอกเบี้ย พร้อมค่าเสียหายอื่นๆ
          </TH>
        </TR>
        <Spacer />

        <TR>
          <TH width={100}>
            ที่ผู้ให้กู้จะพึงได้รับอันเนื่องมาจากการบังคับให้ผู้กู้ชำระหนี้ตามสัญญานี้
          </TH>
        </TR>
        <Spacer />

        {/* หมายเหตุ */}
        <TR>
          <TH width={7}>หมายเหตุ</TH>
          <TH width={93} align="center" underline>
            {note}
          </TH>
        </TR>
        <TR>
          <TH width={100} align="center" underline />
        </TR>
        <TR>
          <TH width={100} align="center" underline />
        </TR>
        <Spacer />

        <TR>
          <TH width={100}>
            ผู้กู้ได้เข้าใจข้อความในหนังสือสัญญานี้โดยตลอดแล้ว
            จึงได้ลงลายมือชื่อไว้สำคัญต่อหน้าพยาน
          </TH>
        </TR>
        <Spacer size={10} />

        {/* ลายเซ็นผู้กู้และผู้ให้กู้ */}
        <TR>
          <EmptyTH width={12} />
          <TH width={4}>ลงชื่อ</TH>
          <TH width={25} align="center" underline />
          <TH width={4}>ผู้กู้</TH>
          <EmptyTH width={12} />
          <TH width={4}>ลงชื่อ</TH>
          <TH width={25} align="center" underline />
          <TH width={4}>ผู้ให้กู้</TH>
          <EmptyTH width={10} />
        </TR>
        <Spacer />

        <TR>
          <EmptyTH width={15} />
          <TH width={1}>(</TH>
          <TH width={25}>..............................................................</TH>
          <TH width={1}>)</TH>
          <EmptyTH width={18} />
          <TH width={1}>(</TH>
          <TH width={25}>..............................................................</TH>
          <TH width={1}>)</TH>
          <EmptyTH width={13} />
        </TR>
        <Spacer size={10} />

        {/* ลายเซ็นพยาน */}
        <TR>
          <EmptyTH width={12} />
          <TH width={4}>ลงชื่อ</TH>
          <TH width={25} align="center" underline />
          <TH width={4}>พยาน</TH>
          <EmptyTH width={12} />
          <TH width={4}>ลงชื่อ</TH>
          <TH width={25} align="center" underline />
          <TH width={4}>พยาน</TH>
          <EmptyTH width={10} />
        </TR>
        <Spacer />

        <TR>
          <EmptyTH width={15} />
          <TH width={1}>(</TH>
          <TH width={25}>..............................................................</TH>
          <TH width={1}>)</TH>
          <EmptyTH width={18} />
          <TH width={1}>(</TH>
          <TH width={25}>..............................................................</TH>
          <TH width={1}>)</TH>
          <EmptyTH width={13} />
        </TR>
      </Page>
    </Document>
  );
};

export default LoanContractPDF;

