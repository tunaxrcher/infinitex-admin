// src/features/land-accounts/repositories/landAccountRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class LandAccountRepository {
  async findMany(options: {
    where?: Prisma.LandAccountWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.LandAccountOrderByWithRelationInput;
    include?: Prisma.LandAccountInclude;
  }) {
    return prisma.landAccount.findMany(options);
  }

  async findById(id: string, include?: Prisma.LandAccountInclude) {
    return prisma.landAccount.findUnique({
      where: { id },
      include,
    });
  }

  async count(where?: Prisma.LandAccountWhereInput) {
    return prisma.landAccount.count({ where });
  }

  async create(data: Prisma.LandAccountCreateInput) {
    return prisma.landAccount.create({ data });
  }

  async update(id: string, data: Prisma.LandAccountUpdateInput) {
    return prisma.landAccount.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    // Soft delete
    return prisma.landAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async paginate(options: {
    where?: Prisma.LandAccountWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.LandAccountOrderByWithRelationInput;
    include?: Prisma.LandAccountInclude;
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

export const landAccountRepository = new LandAccountRepository();
