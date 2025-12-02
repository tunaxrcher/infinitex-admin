// src/features/land-accounts/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';
import { landAccountLogRepository } from '../repositories/landAccountLogRepository';
import { landAccountReportRepository } from '../repositories/landAccountReportRepository';
import { landAccountRepository } from '../repositories/landAccountRepository';
import {
  type AccountDepositSchema,
  type AccountTransferSchema,
  type AccountWithdrawSchema,
  type LandAccountCreateSchema,
  type LandAccountFiltersSchema,
  type LandAccountLogFiltersSchema,
  type LandAccountReportFiltersSchema,
  type LandAccountUpdateSchema,
} from '../validations';

// ============================================
// HELPER FUNCTIONS - QUERY BUILDERS
// ============================================

/**
 * Build where clause for land account queries
 */
function buildLandAccountWhere(filters: {
  search?: string;
}): Prisma.LandAccountWhereInput {
  return {
    deletedAt: null,
    ...(filters.search && {
      accountName: {
        contains: filters.search,
      },
    }),
  };
}

/**
 * Build order by clause for land account queries
 */
function buildLandAccountOrderBy(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Prisma.LandAccountOrderByWithRelationInput {
  if (sortBy === 'accountName') {
    return { accountName: sortOrder || 'asc' };
  }
  if (sortBy === 'accountBalance') {
    return { accountBalance: sortOrder || 'desc' };
  }
  return { createdAt: 'desc' };
}

/**
 * Build where clause for land account log queries
 */
function buildLandAccountLogWhere(filters: {
  landAccountId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Prisma.LandAccountLogWhereInput {
  const where: Prisma.LandAccountLogWhereInput = {
    deletedAt: null,
  };

  if (filters.landAccountId) {
    where.landAccountId = filters.landAccountId;
  }

  if (filters.search) {
    where.OR = [
      { detail: { contains: filters.search } },
      { note: { contains: filters.search } },
      { adminName: { contains: filters.search } },
    ];
  }

  if (filters.dateFrom && filters.dateTo) {
    where.createdAt = {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    };
  }

  return where;
}

/**
 * Build order by clause for land account log queries
 */
function buildLandAccountLogOrderBy(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Prisma.LandAccountLogOrderByWithRelationInput {
  if (sortBy === 'amount') {
    return { amount: sortOrder || 'desc' };
  }
  return { createdAt: sortOrder || 'desc' };
}

/**
 * Build where clause for land account report queries
 */
function buildLandAccountReportWhere(filters: {
  landAccountId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Prisma.LandAccountReportWhereInput {
  const where: Prisma.LandAccountReportWhereInput = {
    deletedAt: null,
    OR: [
      { detail: { contains: 'ชำระสินเชื่อ' } },
      { detail: { contains: 'เปิดสินเชื่อ' } },
      { detail: { contains: 'ลบสินเชื่อ' } },
    ],
  };

  if (filters.landAccountId) {
    where.landAccountId = filters.landAccountId;
  }

  if (filters.search) {
    where.OR = [
      { detail: { contains: filters.search } },
      { note: { contains: filters.search } },
      { adminName: { contains: filters.search } },
    ];
  }

  if (filters.dateFrom && filters.dateTo) {
    where.createdAt = {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    };
  }

  return where;
}

/**
 * Build order by clause for land account report queries
 */
function buildLandAccountReportOrderBy(
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
): Prisma.LandAccountReportOrderByWithRelationInput {
  if (sortBy === 'amount') {
    return { amount: sortOrder || 'desc' };
  }
  return { createdAt: sortOrder || 'desc' };
}

// ============================================
// LAND ACCOUNT SERVICE
// ============================================

export const landAccountService = {
  async getList(filters: LandAccountFiltersSchema) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = filters;

    return landAccountRepository.paginate({
      where: buildLandAccountWhere({ search }),
      page,
      limit,
      orderBy: buildLandAccountOrderBy(sortBy, sortOrder),
    });
  },

  async getById(id: string) {
    const account = await landAccountRepository.findById(id);
    if (!account || account.deletedAt) {
      throw new Error('ไม่พบข้อมูลบัญชี');
    }
    return account;
  },

  async create(
    data: LandAccountCreateSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const account = await landAccountRepository.create({
      accountName: data.accountName,
      accountBalance: data.accountBalance || 0,
    });

    // Create log entry
    if (data.accountBalance && data.accountBalance > 0) {
      await landAccountLogRepository.create({
        landAccount: { connect: { id: account.id } },
        detail: 'สร้างบัญชี',
        amount: data.accountBalance,
        note: `เปิดบัญชีใหม่: ${data.accountName}`,
        ...(adminId && { admin: { connect: { id: adminId } } }),
        adminName: adminName || undefined,
      });
    }

    return account;
  },

  async update(
    id: string,
    data: LandAccountUpdateSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const account = await this.getById(id);

    const updatedAccount = await landAccountRepository.update(id, {
      ...(data.accountName && { accountName: data.accountName }),
      ...(data.accountBalance !== undefined && {
        accountBalance: data.accountBalance,
      }),
      updatedAt: new Date(),
    });

    // Create log if balance changed
    if (
      data.accountBalance !== undefined &&
      data.accountBalance !== Number(account.accountBalance)
    ) {
      const diff = data.accountBalance - Number(account.accountBalance);
      await landAccountLogRepository.create({
        landAccount: { connect: { id: account.id } },
        detail: diff > 0 ? 'เพิ่มยอดเงิน' : 'ลดยอดเงิน',
        amount: Math.abs(diff),
        note: `แก้ไขยอดเงินจาก ${account.accountBalance} เป็น ${data.accountBalance}`,
        ...(adminId && { admin: { connect: { id: adminId } } }),
        adminName: adminName || undefined,
      });
    }

    return updatedAccount;
  },

  async delete(id: string, adminId?: string, adminName?: string) {
    const account = await this.getById(id);

    // Check if account has balance
    if (Number(account.accountBalance) !== 0) {
      throw new Error('ไม่สามารถลบบัญชีที่มียอดเงินคงเหลือได้');
    }

    await landAccountRepository.delete(id);

    // Create log entry
    await landAccountLogRepository.create({
      landAccount: { connect: { id: account.id } },
      detail: 'ลบบัญชี',
      amount: 0,
      note: `ลบบัญชี: ${account.accountName}`,
      ...(adminId && { admin: { connect: { id: adminId } } }),
      adminName: adminName || undefined,
    });
  },

  async transfer(
    data: AccountTransferSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const { fromAccountId, toAccountId, amount, note } = data;

    if (fromAccountId === toAccountId) {
      throw new Error('ไม่สามารถโอนเงินไปยังบัญชีเดียวกันได้');
    }

    // Use transaction to ensure data consistency
    return prisma.$transaction(async (tx) => {
      // Get both accounts
      const fromAccount = await tx.landAccount.findUnique({
        where: { id: fromAccountId, deletedAt: null },
      });
      const toAccount = await tx.landAccount.findUnique({
        where: { id: toAccountId, deletedAt: null },
      });

      if (!fromAccount) throw new Error('ไม่พบบัญชีต้นทาง');
      if (!toAccount) throw new Error('ไม่พบบัญชีปลายทาง');

      // Check balance
      if (Number(fromAccount.accountBalance) < amount) {
        throw new Error('ยอดเงินในบัญชีไม่เพียงพอ');
      }

      // Update balances
      const updatedFromAccount = await tx.landAccount.update({
        where: { id: fromAccountId },
        data: {
          accountBalance: { decrement: amount },
          updatedAt: new Date(),
        },
      });

      const updatedToAccount = await tx.landAccount.update({
        where: { id: toAccountId },
        data: {
          accountBalance: { increment: amount },
          updatedAt: new Date(),
        },
      });

      // Create log entries
      await tx.landAccountLog.create({
        data: {
          landAccountId: fromAccountId,
          detail: 'โอนเงินออก 💸',
          amount: amount,
          note: note || `โอนไปยัง ${toAccount.accountName}`,
          ...(adminId && { adminId }),
          adminName: adminName || undefined,
        },
      });

      await tx.landAccountLog.create({
        data: {
          landAccountId: toAccountId,
          detail: 'โอนเงินเข้า 💰',
          amount: amount,
          note: note || `รับโอนจาก ${fromAccount.accountName}`,
          ...(adminId && { adminId }),
          adminName: adminName || undefined,
        },
      });

      return {
        fromAccount: updatedFromAccount,
        toAccount: updatedToAccount,
      };
    });
  },

  async deposit(
    data: AccountDepositSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const { accountId, amount, note } = data;

    return prisma.$transaction(async (tx) => {
      const account = await tx.landAccount.findUnique({
        where: { id: accountId, deletedAt: null },
      });

      if (!account) throw new Error('ไม่พบบัญชี');

      const updatedAccount = await tx.landAccount.update({
        where: { id: accountId },
        data: {
          accountBalance: { increment: amount },
          updatedAt: new Date(),
        },
      });

      await tx.landAccountLog.create({
        data: {
          landAccountId: accountId,
          detail: 'เพิ่มเงิน 📈',
          amount: amount,
          note: note || 'เพิ่มเงินเข้าบัญชี',
          ...(adminId && { adminId }),
          adminName: adminName || undefined,
        },
      });

      return updatedAccount;
    });
  },

  async withdraw(
    data: AccountWithdrawSchema,
    adminId?: string,
    adminName?: string,
  ) {
    const { accountId, amount, note } = data;

    return prisma.$transaction(async (tx) => {
      const account = await tx.landAccount.findUnique({
        where: { id: accountId, deletedAt: null },
      });

      if (!account) throw new Error('ไม่พบบัญชี');

      if (Number(account.accountBalance) < amount) {
        throw new Error('ยอดเงินในบัญชีไม่เพียงพอ');
      }

      const updatedAccount = await tx.landAccount.update({
        where: { id: accountId },
        data: {
          accountBalance: { decrement: amount },
          updatedAt: new Date(),
        },
      });

      await tx.landAccountLog.create({
        data: {
          landAccountId: accountId,
          detail: 'ลดเงิน 📉',
          amount: amount,
          note: note || 'ถอนเงินออกจากบัญชี',
          ...(adminId && { adminId }),
          adminName: adminName || undefined,
        },
      });

      return updatedAccount;
    });
  },

  // Get logs for a specific account or all accounts
  async getLogs(filters: LandAccountLogFiltersSchema) {
    const {
      page = 1,
      limit = 10,
      landAccountId,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = filters;

    return landAccountLogRepository.paginate({
      where: buildLandAccountLogWhere({
        landAccountId,
        search,
        dateFrom,
        dateTo,
      }),
      page,
      limit,
      orderBy: buildLandAccountLogOrderBy(sortBy, sortOrder),
      include: {
        landAccount: true,
        admin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },
};

// ============================================
// LAND ACCOUNT REPORT SERVICE
// ============================================

export const landAccountReportService = {
  async getList(filters: LandAccountReportFiltersSchema) {
    const {
      page = 1,
      limit = 10,
      landAccountId,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = filters;

    return landAccountReportRepository.paginate({
      where: buildLandAccountReportWhere({
        landAccountId,
        search,
        dateFrom,
        dateTo,
      }),
      page,
      limit,
      orderBy: buildLandAccountReportOrderBy(sortBy, sortOrder),
      include: {
        landAccount: true,
        admin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  async getById(id: string) {
    const report = await landAccountReportRepository.findById(id, {
      landAccount: true,
      admin: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    });
    if (!report || report.deletedAt) {
      throw new Error('ไม่พบข้อมูลรายงาน');
    }
    return report;
  },

  // Create report (used when loan transactions occur)
  async create(data: {
    landAccountId: string;
    detail: string;
    amount: number;
    note?: string;
    accountBalance?: number;
    adminId?: string;
    adminName?: string;
  }) {
    return landAccountReportRepository.create({
      landAccount: { connect: { id: data.landAccountId } },
      detail: data.detail,
      amount: data.amount,
      note: data.note,
      accountBalance: data.accountBalance,
      ...(data.adminId && { admin: { connect: { id: data.adminId } } }),
      adminName: data.adminName,
    });
  },
};
