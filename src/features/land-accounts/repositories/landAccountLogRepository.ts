// src/features/land-accounts/repositories/landAccountLogRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class LandAccountLogRepository {
  async findMany(options: {
    where?: Prisma.LandAccountLogWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.LandAccountLogOrderByWithRelationInput;
    include?: Prisma.LandAccountLogInclude;
  }) {
    return prisma.landAccountLog.findMany(options);
  }

  async findById(id: string, include?: Prisma.LandAccountLogInclude) {
    return prisma.landAccountLog.findUnique({
      where: { id },
      include,
    });
  }

  async count(where?: Prisma.LandAccountLogWhereInput) {
    return prisma.landAccountLog.count({ where });
  }

  async create(data: Prisma.LandAccountLogCreateInput) {
    return prisma.landAccountLog.create({ data });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.landAccountLog.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async paginate(options: {
    where?: Prisma.LandAccountLogWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.LandAccountLogOrderByWithRelationInput;
    include?: Prisma.LandAccountLogInclude;
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

export const landAccountLogRepository = new LandAccountLogRepository();
