// src/features/land-account-reports/repositories/landAccountReportRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class LandAccountReportRepository {
  async findMany(options: {
    where?: Prisma.LandAccountReportWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.LandAccountReportOrderByWithRelationInput;
    include?: Prisma.LandAccountReportInclude;
  }) {
    return prisma.landAccountReport.findMany(options);
  }

  async findById(id: string, include?: Prisma.LandAccountReportInclude) {
    return prisma.landAccountReport.findUnique({
      where: { id },
      include,
    });
  }

  async count(where?: Prisma.LandAccountReportWhereInput) {
    return prisma.landAccountReport.count({ where });
  }

  async create(data: Prisma.LandAccountReportCreateInput) {
    return prisma.landAccountReport.create({ data });
  }

  async paginate(options: {
    where?: Prisma.LandAccountReportWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.LandAccountReportOrderByWithRelationInput;
    include?: Prisma.LandAccountReportInclude;
  }) {
    const { where, page, limit, orderBy, include } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.count(where),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const landAccountReportRepository = new LandAccountReportRepository();

