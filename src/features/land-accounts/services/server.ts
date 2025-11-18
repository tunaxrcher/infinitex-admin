// src/features/land-accounts/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';
import { landAccountLogRepository } from '../repositories/landAccountLogRepository';
import { landAccountRepository } from '../repositories/landAccountRepository';
import {
  type AccountDepositSchema,
  type AccountTransferSchema,
  type AccountWithdrawSchema,
  type LandAccountCreateSchema,
  type LandAccountFiltersSchema,
  type LandAccountLogFiltersSchema,
  type LandAccountUpdateSchema,
} from '../validations';

export const landAccountService = {
  async getList(filters: LandAccountFiltersSchema) {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = filters;

    const where: Prisma.LandAccountWhereInput = {
      deletedAt: null,
      ...(search && {
        accountName: {
          contains: search,
        },
      }),
    };

    const orderBy: Prisma.LandAccountOrderByWithRelationInput =
      sortBy === 'accountName'
        ? { accountName: sortOrder || 'asc' }
        : sortBy === 'accountBalance'
          ? { accountBalance: sortOrder || 'desc' }
          : { createdAt: 'desc' };

    return landAccountRepository.paginate({
      where,
      page,
      limit,
      orderBy,
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

    const where: Prisma.LandAccountLogWhereInput = {
      deletedAt: null,
      ...(landAccountId && { landAccountId }),
      ...(search && {
        OR: [
          { detail: { contains: search } },
          { note: { contains: search } },
          { adminName: { contains: search } },
        ],
      }),
      ...(dateFrom &&
        dateTo && {
          createdAt: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
        }),
    };

    const orderBy: Prisma.LandAccountLogOrderByWithRelationInput =
      sortBy === 'amount'
        ? { amount: sortOrder || 'desc' }
        : { createdAt: sortOrder || 'desc' };

    return landAccountLogRepository.paginate({
      where,
      page,
      limit,
      orderBy,
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
