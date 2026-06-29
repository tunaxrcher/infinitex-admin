/**
 * ตรวจสอบ (read-only) ว่าหลังย้อนข้อมูลแล้ว ไม่มี record ค้าง/เพี้ยน
 * ในทุกตารางที่อาจเกี่ยวข้องกับสินเชื่อทั้ง 2 ก้อน
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const LOAN_NUMBERS = process.env.LOANS
  ? process.env.LOANS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['LOA86274001428', 'LOA86326135635'];

function money(v) {
  return Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}
function ok(label) {
  console.log(`  [OK]   ${label}`);
}
function warn(label) {
  console.log(`  [WARN] ${label}`);
}

async function main() {
  const loans = await prisma.loan.findMany({
    where: { loanNumber: { in: LOAN_NUMBERS } },
    include: { application: true },
  });
  const loanIds = loans.map((l) => l.id);
  const appIds = loans.map((l) => l.applicationId).filter(Boolean);

  console.log('='.repeat(72));
  console.log('AUDIT - ตรวจทุกตารางที่อาจเกี่ยวข้อง');
  console.log('='.repeat(72));

  // 1) Loan
  console.log('\n[1] LOAN');
  for (const l of loans) {
    const expected = Number(l.principalAmount) * (1 + Number(l.interestRate) / 100);
    const balOk = Math.abs(Number(l.remainingBalance) - expected) < 0.01;
    const fn =
      l.status === 'ACTIVE' && l.currentInstallment === 0 && balOk ? ok : warn;
    fn(
      `${l.loanNumber}: status=${l.status}, currentInstallment=${l.currentInstallment}, remaining=${money(l.remainingBalance)} (ควร ${money(expected)})`,
    );
  }

  // 2) LoanInstallment
  console.log('\n[2] LOAN_INSTALLMENT');
  for (const l of loans) {
    const total = await prisma.loanInstallment.count({ where: { loanId: l.id } });
    const paid = await prisma.loanInstallment.count({
      where: { loanId: l.id, isPaid: true },
    });
    const late = await prisma.loanInstallment.count({
      where: { loanId: l.id, OR: [{ isLate: true }, { lateFee: { not: null } }] },
    });
    const withPaidDate = await prisma.loanInstallment.count({
      where: { loanId: l.id, paidDate: { not: null } },
    });
    const fn = paid === 0 && late === 0 && withPaidDate === 0 ? ok : warn;
    fn(
      `${l.loanNumber}: total=${total}, paid=${paid}, มีค่าปรับ=${late}, มี paidDate=${withPaidDate} (ควรเป็น 0 ทั้งหมด)`,
    );
  }

  // 3) Payment
  console.log('\n[3] PAYMENT');
  const payments = await prisma.payment.findMany({
    where: { loanId: { in: loanIds } },
  });
  (payments.length === 0 ? ok : warn)(
    `payment ที่ผูกกับ 2 สินเชื่อนี้ เหลือ ${payments.length} รายการ (ควร 0)`,
  );

  // 4) LandAccountReport / Log
  console.log('\n[4] LAND_ACCOUNT_REPORT / LOG');
  const orNote = { OR: LOAN_NUMBERS.map((ln) => ({ note: { contains: ln } })) };
  const orDetail = { OR: LOAN_NUMBERS.map((ln) => ({ detail: { contains: ln } })) };
  const reps = await prisma.landAccountReport.count({
    where: { OR: [orNote, orDetail] },
  });
  const logs = await prisma.landAccountLog.count({ where: orNote });
  (reps === 0 ? ok : warn)(`landAccountReport ที่อ้างถึงสินเชื่อนี้ เหลือ ${reps} (ควร 0)`);
  (logs === 0 ? ok : warn)(`landAccountLog ที่อ้างถึงสินเชื่อนี้ เหลือ ${logs} (ควร 0)`);

  // 4.1) ตรวจความต่อเนื่องของ snapshot ในบัญชีที่เกี่ยวข้อง
  console.log('\n[4.1] ตรวจความถูกต้องของ snapshot ยอดคงเหลือ (running balance)');
  const accounts = await prisma.landAccount.findMany({
    where: { accountName: { in: ['Company Kbank', 'Company SCB'] } },
  });
  for (const acc of accounts) {
    const reports = await prisma.landAccountReport.findMany({
      where: { landAccountId: acc.id, accountBalance: { not: null } },
      orderBy: { createdAt: 'asc' },
    });
    // ตรวจว่า snapshot ของรายการสุดท้าย == ยอดคงเหลือบัญชีปัจจุบัน
    const last = reports[reports.length - 1];
    const lastOk =
      last && Math.abs(Number(last.accountBalance) - Number(acc.accountBalance)) < 0.01;
    // ตรวจ running diff ระหว่าง snapshot ติดกัน (เฉพาะที่เป็นเงินเข้า)
    let chainBroken = 0;
    for (let i = 1; i < reports.length; i++) {
      const prev = Number(reports[i - 1].accountBalance);
      const cur = Number(reports[i].accountBalance);
      const detail = reports[i].detail || '';
      const amt = Number(reports[i].amount);
      const isOut = detail.includes('เปิดสินเชื่อ') || detail.includes('อนุมัติสินเชื่อ');
      const expected = isOut ? prev - amt : prev + amt;
      if (Math.abs(expected - cur) > 0.01) chainBroken++;
    }
    const fn = lastOk && chainBroken === 0 ? ok : warn;
    fn(
      `${acc.accountName}: ยอดปัจจุบัน=${money(acc.accountBalance)}, snapshot สุดท้าย=${last ? money(last.accountBalance) : '-'}, จุดที่ running ไม่ต่อเนื่อง=${chainBroken}`,
    );
  }

  // 5) Document (ใบเสร็จ/ใบสำคัญ) ที่อ้างถึงสินเชื่อนี้
  console.log('\n[5] DOCUMENT');
  const docs = await prisma.document.findMany({
    where: {
      OR: LOAN_NUMBERS.flatMap((ln) => [
        { title: { contains: ln } },
        { note: { contains: ln } },
        { docNumber: { contains: ln } },
      ]),
    },
  });
  (docs.length === 0 ? ok : warn)(
    `document ที่อ้างถึงสินเชื่อนี้ = ${docs.length} (โดยปกติการชำระไม่สร้าง document)`,
  );
  docs.forEach((d) =>
    console.log(`       - ${d.docType} ${d.docNumber} | ${d.title} | ${money(d.price)}`),
  );

  // 6) CoinTransaction ที่ผูก loanId
  console.log('\n[6] COIN_TRANSACTION');
  const coins = await prisma.coinTransaction.count({
    where: { loanId: { in: loanIds } },
  });
  (coins === 0 ? ok : warn)(`coinTransaction ที่ผูกสินเชื่อนี้ = ${coins}`);

  // 7) AuditLog ที่อ้าง entityId เป็น loan/payment เหล่านี้
  console.log('\n[7] AUDIT_LOG');
  const audits = await prisma.auditLog.count({
    where: { entity: 'loans', entityId: { in: loanIds } },
  });
  (audits === 0 ? ok : warn)(`auditLog (entity=loans) ที่อ้างสินเชื่อนี้ = ${audits}`);

  // 8) Notification ที่กล่าวถึงสินเชื่อนี้
  console.log('\n[8] NOTIFICATION');
  const notis = await prisma.notification.count({
    where: {
      OR: LOAN_NUMBERS.flatMap((ln) => [
        { title: { contains: ln } },
        { message: { contains: ln } },
        { actionUrl: { contains: ln } },
      ]),
    },
  });
  (notis === 0 ? ok : warn)(`notification ที่กล่าวถึงสินเชื่อนี้ = ${notis}`);

  // 9) LoanApplication status (ไม่ควรถูกแตะ - ควรยัง APPROVED)
  console.log('\n[9] LOAN_APPLICATION');
  const apps = await prisma.loanApplication.findMany({
    where: { id: { in: appIds } },
    select: { id: true, status: true },
  });
  apps.forEach((a) =>
    (a.status === 'APPROVED' ? ok : warn)(`application ${a.id}: status=${a.status}`),
  );

  console.log('\n' + '='.repeat(72));
  console.log('AUDIT เสร็จสิ้น');
  console.log('='.repeat(72));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
