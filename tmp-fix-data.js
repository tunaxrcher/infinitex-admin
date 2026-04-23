const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// ============================================================
// Fix all loans where installments don't match loan record
// Safe: preserves paid installments, skips CANCELLED loans
// ============================================================
// Usage:
//   DRY RUN (default):  node tmp-fix-data.js
//   APPLY FIX:          node tmp-fix-data.js --apply
// ============================================================

const DRY_RUN = !process.argv.includes('--apply');

(async () => {
  try {
    if (DRY_RUN) {
      console.log('🔍 DRY RUN MODE - no changes will be made. Use --apply to fix.\n');
    } else {
      console.log('🔧 APPLY MODE - fixing data...\n');
    }

    // Find all mismatched loans (exclude CANCELLED)
    const mismatched = await p.$queryRawUnsafe(`
      SELECT 
        l.id, l.loanNumber, l.status,
        l.principalAmount, l.interestRate, l.termMonths,
        l.monthlyPayment, l.contractDate,
        COUNT(li.id) AS inst_count,
        MIN(li.totalAmount) AS inst_amount
      FROM loans l
      LEFT JOIN loan_installments li ON li.loanId = l.id
      WHERE l.status != 'CANCELLED'
      GROUP BY l.id
      HAVING 
        inst_count != l.termMonths
        OR ROUND(inst_amount, 2) != ROUND(l.monthlyPayment, 2)
      ORDER BY FIELD(l.status, 'ACTIVE', 'COMPLETED'), l.updatedAt DESC
    `);

    console.log(`Found ${mismatched.length} loans with mismatched installments\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    const results = { fixed: [], skipped_has_paid: [], skipped_partial: [] };

    for (const loan of mismatched) {
      const loanId = loan.id;
      const termMonths = loan.termMonths;
      const monthlyPayment = Number(loan.monthlyPayment);
      const contractDate = new Date(loan.contractDate);

      // Count paid vs unpaid installments
      const [paidResult] = await p.$queryRawUnsafe(
        "SELECT COUNT(*) as cnt FROM loan_installments WHERE loanId = ? AND isPaid = 1", loanId
      );
      const [totalResult] = await p.$queryRawUnsafe(
        "SELECT COUNT(*) as cnt FROM loan_installments WHERE loanId = ?", loanId
      );
      const paidCount = Number(paidResult.cnt);
      const totalCount = Number(totalResult.cnt);

      const tag = `[${loan.loanNumber}] (${loan.status})`;

      if (paidCount === 0) {
        // Case 1: No paid installments → safe to delete all and regenerate
        console.log(`${tag} paid=0/${totalCount} → DELETE ALL & REGENERATE ${termMonths} installments @ ${monthlyPayment}/month`);

        if (!DRY_RUN) {
          await p.loanInstallment.deleteMany({ where: { loanId } });

          const installments = [];
          for (let i = 1; i <= termMonths; i++) {
            const dueDate = new Date(contractDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            installments.push({
              loanId,
              installmentNumber: i,
              dueDate,
              principalAmount: 0,
              interestAmount: monthlyPayment,
              totalAmount: monthlyPayment,
              isPaid: false,
              isLate: false,
            });
          }
          await p.loanInstallment.createMany({ data: installments });
        }

        results.fixed.push(loan.loanNumber);
        fixedCount++;
      } else if (paidCount <= termMonths) {
        // Case 2: Has paid installments → keep paid, regenerate unpaid
        const remainingMonths = termMonths - paidCount;
        console.log(`${tag} paid=${paidCount}/${totalCount} → KEEP PAID, DELETE UNPAID & REGENERATE ${remainingMonths} remaining @ ${monthlyPayment}/month`);

        if (!DRY_RUN) {
          // Delete only unpaid installments
          await p.loanInstallment.deleteMany({ where: { loanId, isPaid: false } });

          if (remainingMonths > 0) {
            const installments = [];
            for (let i = 1; i <= remainingMonths; i++) {
              const dueDate = new Date(contractDate);
              dueDate.setMonth(dueDate.getMonth() + paidCount + i);
              installments.push({
                loanId,
                installmentNumber: paidCount + i,
                dueDate,
                principalAmount: 0,
                interestAmount: monthlyPayment,
                totalAmount: monthlyPayment,
                isPaid: false,
                isLate: false,
              });
            }
            await p.loanInstallment.createMany({ data: installments });
          }
        }

        results.skipped_partial.push(loan.loanNumber);
        fixedCount++;
      } else {
        // Case 3: More paid installments than termMonths — something weird, skip
        console.log(`${tag} paid=${paidCount}/${totalCount} > termMonths=${termMonths} → SKIP (needs manual review)`);
        results.skipped_has_paid.push(loan.loanNumber);
        skippedCount++;
      }
    }

    console.log('\n========== SUMMARY ==========');
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Skipped (needs review): ${skippedCount}`);
    if (results.skipped_has_paid.length > 0) {
      console.log(`Skipped loans: ${results.skipped_has_paid.join(', ')}`);
    }
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN. Run with --apply to actually fix the data.');
    } else {
      console.log('\n✅ All fixes applied!');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();
