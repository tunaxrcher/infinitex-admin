// src/features/land-account-reports/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import { landAccountReportRepository } from '../repositories/landAccountReportRepository';
import { type LandAccountReportFiltersSchema } from '../validations';

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

    const where: Prisma.LandAccountReportWhereInput = {
      deletedAt: null,
      OR: [
        { detail: { contains: 'ชำระสินเชื่อ' } },
        { detail: { contains: 'เปิดสินเชื่อ' } },
        { detail: { contains: 'ลบสินเชื่อ' } },
      ],
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

    const orderBy: Prisma.LandAccountReportOrderByWithRelationInput =
      sortBy === 'amount'
        ? { amount: sortOrder || 'desc' }
        : { createdAt: sortOrder || 'desc' };

    return landAccountReportRepository.paginate({
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
