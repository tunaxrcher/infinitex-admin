/**
 * ย้อนข้อมูลสินเชื่อที่ถูกชำระ/ปิดผิดพลาด กลับไปสถานะ ACTIVE ก่อนทำรายการ
 *
 * การใช้งาน (รันจาก root ของโปรเจกต์):
 *   ตรวจสอบแผน (ไม่แก้ข้อมูล):   node --env-file=.env scripts/loan-revert/revert-loans.mjs
 *   ลงมือแก้จริง:                APPLY=1 node --env-file=.env scripts/loan-revert/revert-loans.mjs
 *   ระบุเลขสินเชื่อเองได้:        LOANS="LOAxxx,LOAyyy" node --env-file=.env scripts/loan-revert/revert-loans.mjs
 *
 * สิ่งที่ทำต่อแต่ละสินเชื่อ:
 *   1. loan        -> status=ACTIVE, currentInstallment=0, remainingBalance=principal*(1+rate/100)
 *   2. installments -> isPaid=false, paidDate=null, paidAmount=null, isLate=false, lateDays=null, lateFee=null
 *   3. payments    -> ลบ payment ที่เกิดจากการทำรายการผิด (ของ loan นั้น)
 *   4. land account -> ลบ report+log ที่เกี่ยวกับ loan นั้น, คืนยอดบัญชี,
 *                      และปรับ snapshot ยอดคงเหลือของ report ที่เกิดขึ้น "ทีหลัง" ในบัญชีเดียวกัน
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.env.APPLY === '1';
const LOAN_NUMBERS = process.env.LOANS
  ? process.env.LOANS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['LOA86274001428', 'LOA86326135635'];

function money(v) {
  return Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}
function log(...args) {
  console.log(...args);
}

async function main() {
  log('='.repeat(72));
  log(APPLY ? '>>> โหมด APPLY: จะแก้ไขข้อมูลจริง <<<' : '>>> โหมด DRY-RUN: แสดงแผนเท่านั้น ไม่แก้ข้อมูล <<<');
  log('='.repeat(72));

  // ---- 1) เก็บข้อมูลสินเชื่อ + เตรียมแผน ----
  const loanPlans = [];
  const allPaymentIds = [];

  for (const loanNumber of LOAN_NUMBERS) {
    const loan = await prisma.loan.findUnique({
      where: { loanNumber },
      include: {
        installments: true,
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!loan) {
      throw new Error(`ไม่พบสินเชื่อ ${loanNumber} - ยกเลิกทั้งหมด`);
    }

    const targetRemaining =
      Number(loan.principalAmount) * (1 + Number(loan.interestRate) / 100);

    loanPlans.push({ loan, targetRemaining });
    loan.payments.forEach((p) => allPaymentIds.push(p.id));

    log(`\n[${loanNumber}] (loanId=${loan.id})`);
    log(`  loan : status ${loan.status} -> ACTIVE`);
    log(`         currentInstallment ${loan.currentInstallment} -> 0`);
    log(`         remainingBalance ${money(loan.remainingBalance)} -> ${money(targetRemaining)}`);
    const paidCount = loan.installments.filter((i) => i.isPaid).length;
    log(`  installments : ปลดสถานะชำระ ${paidCount}/${loan.installments.length} งวด -> ยังไม่ชำระทั้งหมด`);
    log(`  payments     : ลบ ${loan.payments.length} รายการ`);
    loan.payments.forEach((p) =>
      log(`      - ${p.referenceNumber} | ${p.status} | ${money(p.amount)} | ${p.createdAt.toISOString()}`),
    );
  }

  // ---- 2) เก็บ land account reports/logs ที่ต้องลบ ----
  const orNote = { OR: LOAN_NUMBERS.map((ln) => ({ note: { contains: ln } })) };

  const reportsToDelete = await prisma.landAccountReport.findMany({
    where: orNote,
    orderBy: { createdAt: 'asc' },
  });
  const logsToDelete = await prisma.landAccountLog.findMany({
    where: orNote,
    orderBy: { createdAt: 'asc' },
  });

  // group reportsToDelete by account
  const byAccount = new Map();
  for (const r of reportsToDelete) {
    if (!byAccount.has(r.landAccountId)) byAccount.set(r.landAccountId, []);
    byAccount.get(r.landAccountId).push(r);
  }

  // ---- 3) คำนวณการปรับ snapshot ของ report ที่มาทีหลัง + ยอดบัญชี ----
  const snapshotAdjustments = []; // { reportId, oldBalance, newBalance, detail }
  const accountDecrements = []; // { accountId, accountName, total, oldBalance, newBalance }

  log('\n' + '-'.repeat(72));
  log('LAND ACCOUNT - การคืนยอด & ปรับ snapshot');
  log('-'.repeat(72));

  for (const [accountId, deletedReports] of byAccount.entries()) {
    const account = await prisma.landAccount.findUnique({
      where: { id: accountId },
    });
    const totalRemoved = deletedReports.reduce(
      (s, r) => s + Number(r.amount),
      0,
    );

    // reports อื่น ๆ ในบัญชีนี้ที่ "ไม่ได้ถูกลบ"
    const deletedIds = new Set(deletedReports.map((r) => r.id));
    const remainingReports = await prisma.landAccountReport.findMany({
      where: { landAccountId: accountId, id: { notIn: [...deletedIds] } },
      orderBy: { createdAt: 'asc' },
    });

    for (const r of remainingReports) {
      const adj = deletedReports
        .filter((d) => d.createdAt < r.createdAt)
        .reduce((s, d) => s + Number(d.amount), 0);
      if (adj !== 0 && r.accountBalance != null) {
        snapshotAdjustments.push({
          reportId: r.id,
          detail: r.detail,
          createdAt: r.createdAt,
          oldBalance: Number(r.accountBalance),
          newBalance: Number(r.accountBalance) - adj,
        });
      }
    }

    const oldBal = Number(account.accountBalance);
    accountDecrements.push({
      accountId,
      accountName: account.accountName,
      total: totalRemoved,
      oldBalance: oldBal,
      newBalance: oldBal - totalRemoved,
    });

    log(`\n  บัญชี ${account.accountName} (${accountId})`);
    log(`    ลบ report ${deletedReports.length} รายการ รวม ${money(totalRemoved)}`);
    log(`    ยอดคงเหลือ ${money(oldBal)} -> ${money(oldBal - totalRemoved)}`);
  }

  if (snapshotAdjustments.length) {
    log('\n  ปรับ snapshot ยอดคงเหลือของ report ที่เกิดทีหลัง:');
    snapshotAdjustments.forEach((s) =>
      log(`    - [${s.detail}] ${money(s.oldBalance)} -> ${money(s.newBalance)} (${s.createdAt.toISOString()})`),
    );
  }

  log(`\n  จะลบ landAccountReport ${reportsToDelete.length} รายการ, landAccountLog ${logsToDelete.length} รายการ`);

  // ---- 4) ลงมือแก้ ----
  if (!APPLY) {
    log('\n' + '='.repeat(72));
    log('DRY-RUN เท่านั้น — ยังไม่มีการแก้ไขข้อมูล');
    log('ถ้าแผนถูกต้อง ให้สั่ง: APPLY=1 node --env-file=.env scripts/revert-loans.mjs');
    log('='.repeat(72));
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 4.1 reset loans + installments
    for (const { loan, targetRemaining } of loanPlans) {
      await tx.loanInstallment.updateMany({
        where: { loanId: loan.id },
        data: {
          isPaid: false,
          paidDate: null,
          paidAmount: null,
          isLate: false,
          lateDays: null,
          lateFee: null,
          updatedAt: new Date(),
        },
      });
      await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: 'ACTIVE',
          currentInstallment: 0,
          remainingBalance: targetRemaining,
          updatedAt: new Date(),
        },
      });
    }

    // 4.2 ลบ payments
    if (allPaymentIds.length) {
      await tx.payment.deleteMany({ where: { id: { in: allPaymentIds } } });
    }

    // 4.3 ปรับ snapshot ของ report ที่มาทีหลัง
    for (const s of snapshotAdjustments) {
      await tx.landAccountReport.update({
        where: { id: s.reportId },
        data: { accountBalance: s.newBalance },
      });
    }

    // 4.4 คืนยอดบัญชี
    for (const a of accountDecrements) {
      await tx.landAccount.update({
        where: { id: a.accountId },
        data: {
          accountBalance: { decrement: a.total },
          updatedAt: new Date(),
        },
      });
    }

    // 4.5 ลบ report + log ที่เกี่ยวกับสินเชื่อผิด
    await tx.landAccountReport.deleteMany({
      where: { id: { in: reportsToDelete.map((r) => r.id) } },
    });
    await tx.landAccountLog.deleteMany({
      where: { id: { in: logsToDelete.map((l) => l.id) } },
    });
  });

  log('\n' + '='.repeat(72));
  log('สำเร็จ! ย้อนข้อมูลสินเชื่อทั้งหมดเรียบร้อยแล้ว');
  log('='.repeat(72));
}

main()
  .catch((e) => {
    console.error('\nเกิดข้อผิดพลาด - ไม่มีการแก้ไขข้อมูล (rollback):', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
