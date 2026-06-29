import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LOAN_NUMBERS = ['LOA86274001428', 'LOA86326135635'];

function money(v) {
  return Number(v).toLocaleString('th-TH', { minimumFractionDigits: 2 });
}

async function main() {
  for (const loanNumber of LOAN_NUMBERS) {
    console.log('\n' + '='.repeat(70));
    console.log(`LOAN: ${loanNumber}`);
    console.log('='.repeat(70));

    const loan = await prisma.loan.findUnique({
      where: { loanNumber },
      include: {
        installments: { orderBy: { installmentNumber: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!loan) {
      console.log('  !! ไม่พบสินเชื่อนี้');
      continue;
    }

    console.log('\n[LOAN RECORD]');
    console.log(`  id                : ${loan.id}`);
    console.log(`  status            : ${loan.status}`);
    console.log(`  principalAmount   : ${money(loan.principalAmount)}`);
    console.log(`  interestRate      : ${loan.interestRate}`);
    console.log(`  monthlyPayment    : ${money(loan.monthlyPayment)}`);
    console.log(`  currentInstallment: ${loan.currentInstallment}`);
    console.log(`  totalInstallments : ${loan.totalInstallments}`);
    console.log(`  remainingBalance  : ${money(loan.remainingBalance)}`);
    const expectedActiveBalance =
      Number(loan.principalAmount) * (1 + Number(loan.interestRate) / 100);
    console.log(
      `  -> remainingBalance ที่ควรเป็นตอน ACTIVE = ${money(expectedActiveBalance)}`,
    );

    console.log('\n[INSTALLMENTS] (เฉพาะที่ถูกชำระ)');
    const paid = loan.installments.filter((i) => i.isPaid);
    console.log(`  จำนวนงวดทั้งหมด: ${loan.installments.length}, ชำระแล้ว: ${paid.length}`);
    for (const inst of paid) {
      console.log(
        `   - งวด ${inst.installmentNumber}: isPaid=${inst.isPaid} paidDate=${inst.paidDate?.toISOString?.() ?? inst.paidDate} paidAmount=${inst.paidAmount} lateFee=${inst.lateFee}`,
      );
    }

    console.log('\n[PAYMENTS]');
    for (const p of loan.payments) {
      console.log(
        `   - ${p.createdAt.toISOString()} | ref=${p.referenceNumber} | status=${p.status} | amount=${money(p.amount)} | installmentId=${p.installmentId ?? '-'} | principal=${money(p.principalAmount)} interest=${money(p.interestAmount)} fee=${money(p.feeAmount)}`,
      );
    }

    // Related land account reports/logs by note containing loanNumber
    console.log('\n[LAND ACCOUNT REPORTS] (note contains loanNumber)');
    const reports = await prisma.landAccountReport.findMany({
      where: { note: { contains: loanNumber } },
      orderBy: { createdAt: 'asc' },
      include: { landAccount: true },
    });
    for (const r of reports) {
      console.log(
        `   - ${r.createdAt.toISOString()} | acct=${r.landAccount?.accountName} (${r.landAccountId}) | detail="${r.detail}" | amount=${money(r.amount)} | balanceSnapshot=${money(r.accountBalance)} | id=${r.id}`,
      );
    }

    console.log('\n[LAND ACCOUNT LOGS] (note contains loanNumber)');
    const logs = await prisma.landAccountLog.findMany({
      where: { note: { contains: loanNumber } },
      orderBy: { createdAt: 'asc' },
      include: { landAccount: true },
    });
    for (const l of logs) {
      console.log(
        `   - ${l.createdAt.toISOString()} | acct=${l.landAccount?.accountName} (${l.landAccountId}) | detail="${l.detail}" | amount=${money(l.amount)} | id=${l.id}`,
      );
    }
  }

  // Show current balances of involved accounts + whether these are the latest entries
  console.log('\n' + '='.repeat(70));
  console.log('LAND ACCOUNTS - สถานะปัจจุบัน + 5 รายการล่าสุดในแต่ละบัญชีที่เกี่ยวข้อง');
  console.log('='.repeat(70));

  const involvedAccountIds = new Set();
  const allReports = await prisma.landAccountReport.findMany({
    where: {
      OR: LOAN_NUMBERS.map((ln) => ({ note: { contains: ln } })),
    },
    select: { landAccountId: true },
  });
  allReports.forEach((r) => involvedAccountIds.add(r.landAccountId));

  for (const accId of involvedAccountIds) {
    const acc = await prisma.landAccount.findUnique({ where: { id: accId } });
    console.log(`\n  บัญชี: ${acc?.accountName} (${accId})`);
    console.log(`  ยอดคงเหลือปัจจุบัน: ${money(acc?.accountBalance)}`);
    const latest = await prisma.landAccountReport.findMany({
      where: { landAccountId: accId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log('  5 รายการล่าสุด (report):');
    for (const r of latest) {
      console.log(
        `    - ${r.createdAt.toISOString()} | "${r.detail}" | amount=${money(r.amount)} | snapshot=${money(r.accountBalance)}`,
      );
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
