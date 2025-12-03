// src/features/documents/services/server.ts
import 'server-only';
import { DocType, Prisma } from '@prisma/client';
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
    // Parse docDate to Date object
    const docDate = new Date(data.docDate);

    // Find or create document title in document_title_lists
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

    // Find land account by name
    const landAccount = await prisma.landAccount.findFirst({
      where: {
        accountName: data.cashFlowName,
        deletedAt: null,
      },
    });

    if (landAccount) {
      // Determine detail pattern for land_account_reports
      // ใบสำคัญจ่าย(หมวดหมู่) or ใบสำคัญรับ(หมวดหมู่)
      const docTypeLabel =
        data.docType === 'RECEIPT' ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย';
      const detail = `${docTypeLabel}(${data.title})`;

      // Calculate new balance
      // Receipt = income = add to balance
      // Payment Voucher = expense = subtract from balance
      const isIncome = data.docType === 'RECEIPT';
      const newBalance = isIncome
        ? Number(landAccount.accountBalance) + data.price
        : Number(landAccount.accountBalance) - data.price;

      // Create land account report
      await prisma.landAccountReport.create({
        data: {
          landAccountId: landAccount.id,
          detail,
          amount: isIncome ? data.price : -data.price,
          note: data.note,
          accountBalance: newBalance,
          ...(adminId && { adminId }),
          adminName,
        },
      });

      // Update land account balance
      await prisma.landAccount.update({
        where: { id: landAccount.id },
        data: {
          accountBalance: isIncome
            ? { increment: data.price }
            : { decrement: data.price },
          updatedAt: new Date(),
        },
      });

      // Create land account log
      await prisma.landAccountLog.create({
        data: {
          landAccountId: landAccount.id,
          detail: isIncome
            ? `รับเงิน 📈 ${docTypeLabel}`
            : `จ่ายเงิน 📉 ${docTypeLabel}`,
          amount: data.price,
          note: `${data.docNumber} - ${data.title}`,
          ...(adminId && { adminId }),
          adminName,
        },
      });
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
    const docTypeLabel = isIncome ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย';

    // Check if price or account changed
    const hasChanges =
      oldCashFlowName !== newCashFlowName || oldPrice !== newPrice;

    if (hasChanges) {
      // Step 1: Reverse the old transaction on the old account
      const oldLandAccount = await prisma.landAccount.findFirst({
        where: {
          accountName: oldCashFlowName,
          deletedAt: null,
        },
      });

      if (oldLandAccount) {
        // Reverse: Receipt = subtract, Payment = add back
        const newOldAccountBalance = isIncome
          ? Number(oldLandAccount.accountBalance) - oldPrice
          : Number(oldLandAccount.accountBalance) + oldPrice;

        // Update old account balance
        await prisma.landAccount.update({
          where: { id: oldLandAccount.id },
          data: {
            accountBalance: isIncome
              ? { decrement: oldPrice }
              : { increment: oldPrice },
            updatedAt: new Date(),
          },
        });

        // Create report for reversal
        const reverseDetail = `ลบ${docTypeLabel}(${oldTitle})`;
        const reverseNote = `ทำการแก้ไขรายการ ${docTypeLabel}(${oldTitle}) ทำการแก้ไขจากบัญชี ${oldCashFlowName} จำนวนเงิน ${oldPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} แก้ไขเป็น บัญชี ${newCashFlowName} จำนวนเงิน ${newPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

        await prisma.landAccountReport.create({
          data: {
            landAccountId: oldLandAccount.id,
            detail: reverseDetail,
            amount: isIncome ? -oldPrice : oldPrice,
            note: reverseNote,
            accountBalance: newOldAccountBalance,
            ...(adminId && { adminId }),
            adminName,
          },
        });

        // Create log for reversal
        await prisma.landAccountLog.create({
          data: {
            landAccountId: oldLandAccount.id,
            detail: `${reverseDetail} 📝`,
            amount: oldPrice,
            note: `แก้ไข ${existingDoc.docNumber} - ${oldTitle}`,
            ...(adminId && { adminId }),
            adminName,
          },
        });
      }

      // Step 2: Apply the new transaction on the new account
      const newLandAccount = await prisma.landAccount.findFirst({
        where: {
          accountName: newCashFlowName,
          deletedAt: null,
        },
      });

      if (newLandAccount) {
        // Apply: Receipt = add, Payment = subtract
        const newAccountBalance = isIncome
          ? Number(newLandAccount.accountBalance) + newPrice
          : Number(newLandAccount.accountBalance) - newPrice;

        // Update new account balance
        await prisma.landAccount.update({
          where: { id: newLandAccount.id },
          data: {
            accountBalance: isIncome
              ? { increment: newPrice }
              : { decrement: newPrice },
            updatedAt: new Date(),
          },
        });

        // Create report for new transaction
        const addDetail = `เพิ่มรายการแก้ไข${docTypeLabel}(${newTitle}) แก้ไขจากบัญชี ${oldCashFlowName} จำนวนเงิน ${oldPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} แก้ไขเป็น บัญชี ${newCashFlowName} จำนวนเงิน ${newPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;

        await prisma.landAccountReport.create({
          data: {
            landAccountId: newLandAccount.id,
            detail: addDetail,
            amount: isIncome ? newPrice : -newPrice,
            note: data.note || '',
            accountBalance: newAccountBalance,
            ...(adminId && { adminId }),
            adminName,
          },
        });

        // Create log for new transaction
        await prisma.landAccountLog.create({
          data: {
            landAccountId: newLandAccount.id,
            detail: isIncome
              ? `รับเงิน 📈 ${docTypeLabel}(แก้ไข)`
              : `จ่ายเงิน 📉 ${docTypeLabel}(แก้ไข)`,
            amount: newPrice,
            note: `${existingDoc.docNumber} - ${newTitle}`,
            ...(adminId && { adminId }),
            adminName,
          },
        });
      }
    }

    // Find or create document title in document_title_lists if title changed
    if (data.title && data.title !== existingDoc.title) {
      await documentTitleListService.findOrCreate(
        existingDoc.docType,
        data.title,
      );
    }

    // Update document
    const updatedDocument = await documentRepository.update(id, {
      ...(data.docDate && { docDate: new Date(data.docDate) }),
      ...(data.title && { title: data.title }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.cashFlowName && { cashFlowName: data.cashFlowName }),
      ...(data.note !== undefined && { note: data.note }),
      ...(data.filePath !== undefined && { filePath: data.filePath }),
      updatedAt: new Date(),
    });

    return updatedDocument;
  },

  async delete(id: string, adminId?: string, adminName?: string) {
    const existingDoc = await this.getById(id);
    const amount = Number(existingDoc.price);
    const isIncome = existingDoc.docType === 'RECEIPT';
    const docTypeLabel = isIncome ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย';

    // Reverse the transaction in land account
    const landAccount = await prisma.landAccount.findFirst({
      where: {
        accountName: existingDoc.cashFlowName,
        deletedAt: null,
      },
    });

    if (landAccount) {
      // Reverse: Receipt = subtract, Payment = add back
      const newBalance = isIncome
        ? Number(landAccount.accountBalance) - amount
        : Number(landAccount.accountBalance) + amount;

      // Update account balance
      await prisma.landAccount.update({
        where: { id: landAccount.id },
        data: {
          accountBalance: isIncome
            ? { decrement: amount }
            : { increment: amount },
          updatedAt: new Date(),
        },
      });

      // Create land account report for deletion
      const detail = `ลบ${docTypeLabel}(${existingDoc.title})`;
      await prisma.landAccountReport.create({
        data: {
          landAccountId: landAccount.id,
          detail,
          amount: isIncome ? -amount : amount,
          note: existingDoc.note || '',
          accountBalance: newBalance,
          ...(adminId && { adminId }),
          adminName,
        },
      });

      // Create land account log
      await prisma.landAccountLog.create({
        data: {
          landAccountId: landAccount.id,
          detail: `ลบ${docTypeLabel} ❌`,
          amount,
          note: `ลบ ${existingDoc.docNumber} - ${existingDoc.title}`,
          ...(adminId && { adminId }),
          adminName,
        },
      });
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
        customerName: loan.customer?.profile
          ? `${loan.customer.profile.firstName || ''} ${loan.customer.profile.lastName || ''}`.trim()
          : '-',
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
        customerName: payment.user?.profile
          ? `${payment.user.profile.firstName || ''} ${payment.user.profile.lastName || ''}`.trim()
          : '-',
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

// Helper function for Thai month names
function getThaiMonthName(month: number): string {
  const months = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  return months[month - 1] || '';
}
