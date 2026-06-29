import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const loanCount = await prisma.loan.count();
  console.log('Total loans in DB:', loanCount);
  const loans = await prisma.loan.findMany({
    select: { loanNumber: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  console.log('Latest loans:');
  loans.forEach((l) =>
    console.log(`  ${l.loanNumber} | ${l.status} | ${l.createdAt.toISOString()}`),
  );

  const accts = await prisma.landAccount.findMany({
    select: { id: true, accountName: true, accountBalance: true },
  });
  console.log('\nLand accounts:');
  accts.forEach((a) =>
    console.log(`  ${a.accountName} | ${a.accountBalance} | ${a.id}`),
  );
}
main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
