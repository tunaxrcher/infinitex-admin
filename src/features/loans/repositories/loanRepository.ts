// src/features/loans/repositories/loanRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class LoanRepository {
  async findMany(options: {
    where?: Prisma.LoanWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.LoanOrderByWithRelationInput;
    include?: Prisma.LoanInclude;
  }) {
    return prisma.loan.findMany(options);
  }

  async findById(id: string, include?: Prisma.LoanInclude) {
    return prisma.loan.findUnique({
      where: { id },
      include,
    });
  }

  async count(where?: Prisma.LoanWhereInput) {
    return prisma.loan.count({ where });
  }

  async create(data: Prisma.LoanCreateInput) {
    return prisma.loan.create({ data });
  }

  async update(id: string, data: Prisma.LoanUpdateInput) {
    return prisma.loan.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.loan.delete({
      where: { id },
    });
  }

  async paginate(options: {
    where?: Prisma.LoanWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.LoanOrderByWithRelationInput;
    include?: Prisma.LoanInclude;
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

export const loanRepository = new LoanRepository();
