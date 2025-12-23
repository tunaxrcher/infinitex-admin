// src/features/documents/services/server.ts
import 'server-only';
import { DocType, Prisma } from '@prisma/client';
import { getThaiMonthName } from '@src/features/dashboard/services/server';
import { prisma } from '@src/shared/lib/db';
import { documentRepository } from '../repositories/documentRepository';
import { documentTitleListRepository } from '../repositories/documentTitleListRepository';
import {
  type DocumentCreateSchema,
  type DocumentFiltersSchema,
  type DocumentTitleListFiltersSchema,
  type DocumentUpdateSchema,
  type GenerateDocNumberSchema,
  type IncomeExpenseReportFiltersSchema,
} from '../validations';

// ============================================
// HELPER FUNCTIONS - QUERY BUILDERS
// ============================================

function buildDocumentWhere(filters: {
  docType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {
    deletedAt: null,
  };

  if (filters.docType) {
    where.docType = filters.docType as DocType;
  }

  if (filters.search) {
    where.OR = [
      { docNumber: { contains: filters.search } },
      { title: { contains: filters.search } },
      { note: { contains: filters.search } },
      { cashFlowName: { contains: filters.search } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.docDate = {};
    if (filters.dateFrom) {
      where.docDate.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.docDate.lte = endDate;
    }
  }

  return where;
}

function buildDocumentOrderBy(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Prisma.DocumentOrderByWithRelationInput {
  if (sortBy === 'docNumber') {
    return { docNumber: sortOrder || 'desc' };
  }
  if (sortBy === 'price') {
    return { price: sortOrder || 'desc' };
  }
  if (sortBy === 'docDate') {
    return { docDate: sortOrder || 'desc' };
  }
  return { createdAt: 'desc' };
}

function buildDocumentTitleListWhere(filters: {
  docType?: string;
  search?: string;
}): Prisma.DocumentTitleListWhereInput {
  const where: Prisma.DocumentTitleListWhereInput = {
    deletedAt: null,
  };

  if (filters.docType) {
    where.docType = filters.docType as DocType;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { note: { contains: filters.search } },
    ];
  }

  return where;
}

// ============================================
// HELPER FUNCTIONS - LAND ACCOUNT OPERATIONS
// ============================================

/**
 * Get document type label in Thai
 */
function getDocTypeLabel(docType: string): string {
  return docType === 'RECEIPT' ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย';
}

/**
 * Find land account by name
 */
async function findLandAccountByName(accountName: string | null) {
  if (!accountName) return null;
  return prisma.landAccount.findFirst({
    where: { accountName, deletedAt: null },
  });
}

/**
 * Apply document transaction to land account (create/update balance, reports, logs)
 */
async function applyDocumentTransaction(
  landAccountId: string,
  currentBalance: number,
  params: {
    amount: number;
    isIncome: boolean;
    docTypeLabel: string;
    title: string;
    docNumber: string;
    note?: string | null;
    adminId?: string;
    adminName?: string;
  },
) {
  const {
    amount,
    isIncome,
    docTypeLabel,
    title,
    docNumber,
    note,
    adminId,
    adminName,
  } = params;

  // Calculate new balance
  const newBalance = isIncome
    ? currentBalance + amount
    : currentBalance - amount;
  const detail = `${docTypeLabel}(${title})`;

  // Update balance
  await prisma.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: isIncome ? { increment: amount } : { decrement: amount },
      updatedAt: new Date(),
    },
  });

  // Create report
  await prisma.landAccountReport.create({
    data: {
      landAccountId,
      detail,
      amount: isIncome ? amount : -amount,
      note,
      accountBalance: newBalance,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  // Create log
  await prisma.landAccountLog.create({
    data: {
      landAccountId,
      detail: isIncome
        ? `รับเงิน 📈 ${docTypeLabel}`
        : `จ่ายเงิน 📉 ${docTypeLabel}`,
      amount,
      note: `${docNumber} - ${title}`,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  return newBalance;
}

/**
 * Reverse document transaction on land account
 */
async function reverseDocumentTransaction(
  landAccountId: string,
  currentBalance: number,
  params: {
    amount: number;
    isIncome: boolean;
    docTypeLabel: string;
    title: string;
    docNumber: string;
    note: string;
    adminId?: string;
    adminName?: string;
  },
) {
  const {
    amount,
    isIncome,
    docTypeLabel,
    title,
    docNumber,
    note,
    adminId,
    adminName,
  } = params;

  // Calculate new balance (reverse of original)
  const newBalance = isIncome
    ? currentBalance - amount
    : currentBalance + amount;
  const detail = `ลบ${docTypeLabel}(${title})`;

  // Update balance (reverse)
  await prisma.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: isIncome ? { decrement: amount } : { increment: amount },
      updatedAt: new Date(),
    },
  });

  // Create report
  await prisma.landAccountReport.create({
    data: {
      landAccountId,
      detail,
      amount: isIncome ? -amount : amount,
      note,
      accountBalance: newBalance,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  // Create log
  await prisma.landAccountLog.create({
    data: {
      landAccountId,
      detail: `${detail} 📝`,
      amount,
      note: `แก้ไข ${docNumber} - ${title}`,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  return newBalance;
}

/**
 * Reverse document transaction on delete
 */
async function deleteDocumentTransaction(
  landAccountId: string,
  currentBalance: number,
  params: {
    amount: number;
    isIncome: boolean;
    docTypeLabel: string;
    title: string;
    docNumber: string;
    note: string;
    adminId?: string;
    adminName?: string;
  },
) {
  const {
    amount,
    isIncome,
    docTypeLabel,
    title,
    docNumber,
    note,
    adminId,
    adminName,
  } = params;

  // Calculate new balance (reverse of original)
  const newBalance = isIncome
    ? currentBalance - amount
    : currentBalance + amount;
  const detail = `ลบ${docTypeLabel}(${title})`;

  // Update balance (reverse)
  await prisma.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: isIncome ? { decrement: amount } : { increment: amount },
      updatedAt: new Date(),
    },
  });

  // Create report
  await prisma.landAccountReport.create({
    data: {
      landAccountId,
      detail,
      amount: isIncome ? -amount : amount,
      note,
      accountBalance: newBalance,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  // Create log (with delete emoji)
  await prisma.landAccountLog.create({
    data: {
      landAccountId,
      detail: `ลบ${docTypeLabel} ❌`,
      amount,
      note: `ลบ ${docNumber} - ${title}`,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  return newBalance;
}

/**
 * Apply document transaction for update (with "(แก้ไข)" suffix in log)
 */
async function applyDocumentTransactionForUpdate(
  landAccountId: string,
  currentBalance: number,
  params: {
    amount: number;
    isIncome: boolean;
    docTypeLabel: string;
    title: string;
    docNumber: string;
    note?: string | null;
    adminId?: string;
    adminName?: string;
  },
) {
  const {
    amount,
    isIncome,
    docTypeLabel,
    title,
    docNumber,
    note,
    adminId,
    adminName,
  } = params;

  // Calculate new balance
  const newBalance = isIncome
    ? currentBalance + amount
    : currentBalance - amount;
  const detail = `${docTypeLabel}(${title})`;

  // Update balance
  await prisma.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: isIncome ? { increment: amount } : { decrement: amount },
      updatedAt: new Date(),
    },
  });

  // Create report
  await prisma.landAccountReport.create({
    data: {
      landAccountId,
      detail: `เพิ่มรายการแก้ไข${detail}`,
      amount: isIncome ? amount : -amount,
      note,
      accountBalance: newBalance,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  // Create log (with "(แก้ไข)" suffix)
  await prisma.landAccountLog.create({
    data: {
      landAccountId,
      detail: isIncome
        ? `รับเงิน 📈 ${docTypeLabel}(แก้ไข)`
        : `จ่ายเงิน 📉 ${docTypeLabel}(แก้ไข)`,
      amount,
      note: `${docNumber} - ${title}`,
      ...(adminId && { adminId }),
      adminName,
    },
  });

  return newBalance;
}

// ============================================
// DOCUMENT SERVICE
// ============================================

export const documentService = {
  async getList(filters: DocumentFiltersSchema) {
    const {
      page = 1,
      limit = 10,
      docType,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = filters;

    return documentRepository.paginate({
      where: buildDocumentWhere({ docType, search, dateFrom, dateTo }),
      page,
      limit,
      orderBy: buildDocumentOrderBy(sortBy, sortOrder),
    });
  },

  async getById(id: string) {
    const document = await documentRepository.findById(id);
    if (!document || document.deletedAt) {
      throw new Error('ไม่พบข้อมูลใบสำคัญ');
    }
    return document;
  },

  async create(
    data: DocumentCreateSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const docDate = new Date(data.docDate);

    // Find or create document title
    await documentTitleListService.findOrCreate(data.docType, data.title);

    // Create document
    const document = await documentRepository.create({
      docType: data.docType as DocType,
      docNumber: data.docNumber,
      docDate,
      title: data.title,
      price: data.price,
      cashFlowName: data.cashFlowName,
      note: data.note,
      filePath: data.filePath,
      username: adminName,
    });

    // Apply transaction to land account if exists
    const landAccount = await findLandAccountByName(data.cashFlowName);
    if (landAccount) {
      const isIncome = data.docType === 'RECEIPT';
      await applyDocumentTransaction(
        landAccount.id,
        Number(landAccount.accountBalance),
        {
          amount: data.price,
          isIncome,
          docTypeLabel: getDocTypeLabel(data.docType),
          title: data.title,
          docNumber: data.docNumber,
          note: data.note,
          adminId,
          adminName,
        },
      );
    }

    return document;
  },

  async update(
    id: string,
    data: DocumentUpdateSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const existingDoc = await this.getById(id);
    const oldPrice = Number(existingDoc.price);
    const newPrice = data.price !== undefined ? data.price : oldPrice;
    const oldCashFlowName = existingDoc.cashFlowName;
    const newCashFlowName = data.cashFlowName || oldCashFlowName;
    const oldTitle = existingDoc.title;
    const newTitle = data.title || oldTitle;
    const isIncome = existingDoc.docType === 'RECEIPT';
    const docTypeLabel = getDocTypeLabel(existingDoc.docType);

    // Handle land account changes if price or account changed
    const hasChanges =
      oldCashFlowName !== newCashFlowName || oldPrice !== newPrice;

    if (hasChanges) {
      const formatCurrency = (n: number) =>
        n.toLocaleString('th-TH', { minimumFractionDigits: 2 });
      const reverseNote = `ทำการแก้ไขรายการ ${docTypeLabel}(${oldTitle}) ทำการแก้ไขจากบัญชี ${oldCashFlowName} จำนวนเงิน ${formatCurrency(oldPrice)} แก้ไขเป็น บัญชี ${newCashFlowName} จำนวนเงิน ${formatCurrency(newPrice)}`;

      // Step 1: Reverse old transaction
      const oldLandAccount = await findLandAccountByName(oldCashFlowName);
      if (oldLandAccount) {
        await reverseDocumentTransaction(
          oldLandAccount.id,
          Number(oldLandAccount.accountBalance),
          {
            amount: oldPrice,
            isIncome,
            docTypeLabel,
            title: oldTitle,
            docNumber: existingDoc.docNumber,
            note: reverseNote,
            adminId,
            adminName,
          },
        );
      }

      // Step 2: Apply new transaction
      const newLandAccount = await findLandAccountByName(newCashFlowName);
      if (newLandAccount) {
        await applyDocumentTransactionForUpdate(
          newLandAccount.id,
          Number(newLandAccount.accountBalance),
          {
            amount: newPrice,
            isIncome,
            docTypeLabel,
            title: newTitle,
            docNumber: existingDoc.docNumber,
            note: data.note || '',
            adminId,
            adminName,
          },
        );
      }
    }

    // Update document title list if title changed
    if (data.title && data.title !== existingDoc.title) {
      await documentTitleListService.findOrCreate(
        existingDoc.docType,
        data.title,
      );
    }

    // Update document
    return documentRepository.update(id, {
      ...(data.docDate && { docDate: new Date(data.docDate) }),
      ...(data.title && { title: data.title }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.cashFlowName && { cashFlowName: data.cashFlowName }),
      ...(data.note !== undefined && { note: data.note }),
      ...(data.filePath !== undefined && { filePath: data.filePath }),
      updatedAt: new Date(),
    });
  },

  async delete(id: string, adminId?: string, adminName?: string) {
    const existingDoc = await this.getById(id);
    const amount = Number(existingDoc.price);
    const isIncome = existingDoc.docType === 'RECEIPT';
    const docTypeLabel = getDocTypeLabel(existingDoc.docType);

    // Reverse the transaction in land account
    const landAccount = await findLandAccountByName(existingDoc.cashFlowName);
    if (landAccount) {
      await deleteDocumentTransaction(
        landAccount.id,
        Number(landAccount.accountBalance),
        {
          amount,
          isIncome,
          docTypeLabel,
          title: existingDoc.title,
          docNumber: existingDoc.docNumber,
          note: existingDoc.note || '',
          adminId,
          adminName,
        },
      );
    }

    await documentRepository.delete(id);
  },

  async generateDocNumber(data: GenerateDocNumberSchema) {
    const date = data.date ? new Date(data.date) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    const prefix = data.docType === 'RECEIPT' ? 'RV' : 'PV';

    const latestDocNumber = await documentRepository.getLatestDocNumber(
      data.docType,
      yearMonth,
    );

    let runNumber = 1;
    if (latestDocNumber) {
      // Extract run number from pattern: RV-YYYYMMXXXX or PV-YYYYMMXXXX
      const match = latestDocNumber.match(/\d{6}(\d{4})$/);
      if (match) {
        runNumber = parseInt(match[1], 10) + 1;
      }
    }

    const docNumber = `${prefix}-${yearMonth}${String(runNumber).padStart(4, '0')}`;
    return { docNumber };
  },
};

// ============================================
// DOCUMENT TITLE LIST SERVICE
// ============================================

export const documentTitleListService = {
  async getList(filters: DocumentTitleListFiltersSchema) {
    const { page = 1, limit = 100, docType, search } = filters;

    return documentTitleListRepository.paginate({
      where: buildDocumentTitleListWhere({ docType, search }),
      page,
      limit,
      orderBy: { title: 'asc' },
    });
  },

  async findOrCreate(docType: string, title: string) {
    // Check if title already exists
    const existingTitle = await prisma.documentTitleList.findFirst({
      where: {
        docType: docType as DocType,
        title,
        deletedAt: null,
      },
    });

    if (existingTitle) {
      return existingTitle;
    }

    // Create new title if not exists
    return prisma.documentTitleList.create({
      data: {
        docType: docType as DocType,
        title,
      },
    });
  },
};

// ============================================
// INCOME/EXPENSE REPORT SERVICE
// ============================================

export const incomeExpenseReportService = {
  async getMonthlyReport(filters: IncomeExpenseReportFiltersSchema) {
    const { year } = filters;

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: getThaiMonthName(i + 1),
      incomeOperation: 0, // รายรับ(ค่าดำเนินการ) - from loans (operationFee + transferFee + otherFee)
      incomeInstallment: 0, // รายรับ(ค่างวด) - from paid installments (payments)
      incomeTotal: 0, // รายรับ(รวม) = รายรับ(ค่าดำเนินการ) + รายรับ(ค่างวด)
      expense: 0, // รายจ่าย - from payment vouchers (ใบสำคัญจ่าย)
      operatingBalance: 0, // ดุลดำเนินการ = รายรับ(ค่าดำเนินการ) - รายจ่าย
      netProfit: 0, // กำไรสุทธิ = รายรับ(รวม) - รายจ่าย
    }));

    // Fetch all data for the year in parallel
    const monthPromises = Array.from({ length: 12 }, (_, i) =>
      this._getMonthData(year, i + 1),
    );
    const monthResults = await Promise.all(monthPromises);

    // Populate monthly data
    monthResults.forEach((result, index) => {
      monthlyData[index].incomeOperation = result.incomeOperation;
      monthlyData[index].incomeInstallment = result.incomeInstallment;
      monthlyData[index].expense = result.expense;
      monthlyData[index].incomeTotal =
        result.incomeOperation + result.incomeInstallment;
      monthlyData[index].operatingBalance =
        result.incomeOperation - result.expense;
      monthlyData[index].netProfit =
        result.incomeOperation + result.incomeInstallment - result.expense;
    });

    // Calculate annual totals
    const totals = {
      incomeOperation: monthlyData.reduce(
        (sum, m) => sum + m.incomeOperation,
        0,
      ),
      incomeInstallment: monthlyData.reduce(
        (sum, m) => sum + m.incomeInstallment,
        0,
      ),
      incomeTotal: monthlyData.reduce((sum, m) => sum + m.incomeTotal, 0),
      expense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
      operatingBalance: monthlyData.reduce(
        (sum, m) => sum + m.operatingBalance,
        0,
      ),
      netProfit: monthlyData.reduce((sum, m) => sum + m.netProfit, 0),
    };

    return {
      year,
      data: monthlyData,
      totals,
    };
  },

  /**
   * Get data for a specific month
   */
  async _getMonthData(year: number, month: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 1. รายรับ(ค่าดำเนินการ) - from loans created in this month
    // Sum of operationFee + transferFee + otherFee from LoanApplication
    const loansWithFees = await prisma.loan.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        contractDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        application: {
          select: {
            operationFee: true,
            transferFee: true,
            otherFee: true,
          },
        },
      },
    });

    const incomeOperation = loansWithFees.reduce((sum, loan) => {
      const opFee = Number(loan.application?.operationFee || 0);
      const trFee = Number(loan.application?.transferFee || 0);
      const otFee = Number(loan.application?.otherFee || 0);
      return sum + opFee + trFee + otFee;
    }, 0);

    // 2. รายรับ(ค่างวด) - from payments completed in this month
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidDate: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const incomeInstallment = payments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );

    // 3. รายจ่าย - from payment vouchers (ใบสำคัญจ่าย) in this month
    const expenseDocuments = await prisma.document.findMany({
      where: {
        docType: 'PAYMENT_VOUCHER',
        deletedAt: null,
        docDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const expense = expenseDocuments.reduce(
      (sum, doc) => sum + Number(doc.price || 0),
      0,
    );

    return {
      incomeOperation,
      incomeInstallment,
      expense,
    };
  },

  /**
   * Get monthly report details by type
   */
  async getMonthlyDetails(
    year: number,
    month: number,
    type: 'income-operation' | 'income-installment' | 'expense',
  ) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    if (type === 'income-operation') {
      // รายรับ(ค่าดำเนินการ) - Loans with fees
      const loans = await prisma.loan.findMany({
        where: {
          status: { in: ['ACTIVE', 'COMPLETED'] },
          contractDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          application: {
            select: {
              operationFee: true,
              transferFee: true,
              otherFee: true,
            },
          },
          customer: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { contractDate: 'desc' },
      });

      return loans.map((loan) => ({
        id: loan.id,
        type: 'loan',
        date: loan.contractDate,
        loanNumber: loan.loanNumber,
        customerName: loan.customer?.profile?.fullName || '-',
        operationFee: Number(loan.application?.operationFee || 0),
        transferFee: Number(loan.application?.transferFee || 0),
        otherFee: Number(loan.application?.otherFee || 0),
        totalFee:
          Number(loan.application?.operationFee || 0) +
          Number(loan.application?.transferFee || 0) +
          Number(loan.application?.otherFee || 0),
        principalAmount: Number(loan.principalAmount),
      }));
    }

    if (type === 'income-installment') {
      // รายรับ(ค่างวด) - Payments
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          paidDate: {
            not: null,
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          loan: {
            select: {
              loanNumber: true,
            },
          },
          user: {
            include: {
              profile: true,
            },
          },
          installment: {
            select: {
              installmentNumber: true,
            },
          },
        },
        orderBy: { paidDate: 'desc' },
      });

      return payments.map((payment) => ({
        id: payment.id,
        type: 'payment',
        date: payment.paidDate,
        loanNumber: payment.loan?.loanNumber || '-',
        customerName: payment.user?.profile?.fullName || '-',
        installmentNumber: payment.installment?.installmentNumber || null,
        amount: Number(payment.amount),
        principalAmount: Number(payment.principalAmount || 0),
        interestAmount: Number(payment.interestAmount || 0),
        feeAmount: Number(payment.feeAmount || 0),
      }));
    }

    if (type === 'expense') {
      // รายจ่าย - Payment vouchers
      const documents = await prisma.document.findMany({
        where: {
          docType: 'PAYMENT_VOUCHER',
          deletedAt: null,
          docDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { docDate: 'desc' },
      });

      return documents.map((doc) => ({
        id: doc.id,
        type: 'document',
        date: doc.docDate,
        docNumber: doc.docNumber,
        title: doc.title,
        cashFlowName: doc.cashFlowName,
        amount: Number(doc.price),
        note: doc.note,
      }));
    }

    return [];
  },
};
