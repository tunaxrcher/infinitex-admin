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
    const { page = 1, limit = 10, docType, search, dateFrom, dateTo, sortBy, sortOrder } = filters;

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
      const docTypeLabel = data.docType === 'RECEIPT' ? 'ใบสำคัญรับ' : 'ใบสำคัญจ่าย';
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
          detail: isIncome ? `รับเงิน 📈 ${docTypeLabel}` : `จ่ายเงิน 📉 ${docTypeLabel}`,
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

    // Calculate price difference for updating land account
    const priceDiff = data.price !== undefined ? data.price - Number(existingDoc.price) : 0;

    const updatedDocument = await documentRepository.update(id, {
      ...(data.docDate && { docDate: new Date(data.docDate) }),
      ...(data.title && { title: data.title }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.cashFlowName && { cashFlowName: data.cashFlowName }),
      ...(data.note !== undefined && { note: data.note }),
      ...(data.filePath !== undefined && { filePath: data.filePath }),
      updatedAt: new Date(),
    });

    // Update land account if price changed
    if (priceDiff !== 0) {
      const landAccount = await prisma.landAccount.findFirst({
        where: {
          accountName: existingDoc.cashFlowName,
          deletedAt: null,
        },
      });

      if (landAccount) {
        const isIncome = existingDoc.docType === 'RECEIPT';
        
        // Update balance: for income, add diff; for expense, subtract diff
        await prisma.landAccount.update({
          where: { id: landAccount.id },
          data: {
            accountBalance: isIncome
              ? { increment: priceDiff }
              : { decrement: priceDiff },
            updatedAt: new Date(),
          },
        });

        // Create adjustment log
        await prisma.landAccountLog.create({
          data: {
            landAccountId: landAccount.id,
            detail: `แก้ไขใบสำคัญ 📝`,
            amount: Math.abs(priceDiff),
            note: `แก้ไข ${existingDoc.docNumber} ปรับยอด ${priceDiff > 0 ? '+' : ''}${priceDiff}`,
            ...(adminId && { adminId }),
            adminName,
          },
        });
      }
    }

    return updatedDocument;
  },

  async delete(id: string, adminId?: string, adminName?: string) {
    const existingDoc = await this.getById(id);

    // Reverse the transaction in land account
    const landAccount = await prisma.landAccount.findFirst({
      where: {
        accountName: existingDoc.cashFlowName,
        deletedAt: null,
      },
    });

    if (landAccount) {
      const isIncome = existingDoc.docType === 'RECEIPT';
      const amount = Number(existingDoc.price);

      // Reverse: for income, subtract; for expense, add back
      await prisma.landAccount.update({
        where: { id: landAccount.id },
        data: {
          accountBalance: isIncome
            ? { decrement: amount }
            : { increment: amount },
          updatedAt: new Date(),
        },
      });

      // Create reversal log
      await prisma.landAccountLog.create({
        data: {
          landAccountId: landAccount.id,
          detail: `ยกเลิกใบสำคัญ ❌`,
          amount,
          note: `ยกเลิก ${existingDoc.docNumber} - ${existingDoc.title}`,
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
};

// ============================================
// INCOME/EXPENSE REPORT SERVICE
// ============================================

export const incomeExpenseReportService = {
  async getMonthlyReport(filters: IncomeExpenseReportFiltersSchema) {
    const { year, landAccountId } = filters;

    // Get all reports for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const whereCondition: Prisma.LandAccountReportWhereInput = {
      deletedAt: null,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (landAccountId) {
      whereCondition.landAccountId = landAccountId;
    }

    const reports = await prisma.landAccountReport.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'asc' },
    });

    // Initialize monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: getThaiMonthName(i + 1),
      incomeOperation: 0, // รายรับ(ค่าดำเนินการ) - from opening loans
      incomeInstallment: 0, // รายรับ(ค่างวด) - from loan payments
      incomeTotal: 0, // รายรับ(รวม)
      expense: 0, // รายจ่าย
      operatingBalance: 0, // ดุลดำเนินการ
      netProfit: 0, // กำไรสุทธิ
    }));

    // Process reports
    reports.forEach((report) => {
      const month = new Date(report.createdAt).getMonth();
      const amount = Number(report.amount);
      const detail = report.detail;

      // Categorize based on detail pattern
      if (detail.includes('เปิดสินเชื่อ') || detail.includes('ค่าดำเนินการ')) {
        monthlyData[month].incomeOperation += amount > 0 ? amount : 0;
      } else if (detail.includes('ชำระสินเชื่อ') || detail.includes('ค่างวด')) {
        monthlyData[month].incomeInstallment += amount > 0 ? amount : 0;
      } else if (detail.includes('ใบสำคัญรับ')) {
        // Receipt voucher = income
        monthlyData[month].incomeOperation += amount > 0 ? amount : 0;
      } else if (detail.includes('ใบสำคัญจ่าย')) {
        // Payment voucher = expense
        monthlyData[month].expense += Math.abs(amount);
      } else if (amount < 0) {
        monthlyData[month].expense += Math.abs(amount);
      } else if (amount > 0) {
        monthlyData[month].incomeOperation += amount;
      }
    });

    // Calculate totals for each month
    monthlyData.forEach((data) => {
      data.incomeTotal = data.incomeOperation + data.incomeInstallment;
      data.operatingBalance = data.incomeTotal - data.expense;
      data.netProfit = data.operatingBalance; // Can be adjusted for other deductions
    });

    // Calculate annual totals
    const totals = {
      incomeOperation: monthlyData.reduce((sum, m) => sum + m.incomeOperation, 0),
      incomeInstallment: monthlyData.reduce((sum, m) => sum + m.incomeInstallment, 0),
      incomeTotal: monthlyData.reduce((sum, m) => sum + m.incomeTotal, 0),
      expense: monthlyData.reduce((sum, m) => sum + m.expense, 0),
      operatingBalance: monthlyData.reduce((sum, m) => sum + m.operatingBalance, 0),
      netProfit: monthlyData.reduce((sum, m) => sum + m.netProfit, 0),
    };

    return {
      year,
      data: monthlyData,
      totals,
    };
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

