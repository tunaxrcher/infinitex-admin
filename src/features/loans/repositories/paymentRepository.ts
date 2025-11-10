// src/features/loans/repositories/paymentRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class PaymentRepository {
  async findMany(options: {
    where?: Prisma.PaymentWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.PaymentOrderByWithRelationInput;
    include?: Prisma.PaymentInclude;
  }) {
    return prisma.payment.findMany(options);
  }

  async findById(id: string, include?: Prisma.PaymentInclude) {
    return prisma.payment.findUnique({
      where: { id },
      include,
    });
  }

  async findByReferenceNumber(referenceNumber: string) {
    return prisma.payment.findUnique({
      where: { referenceNumber },
      include: {
        loan: true,
        installment: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
  }

  async findByLoanId(loanId: string, options?: {
    status?: string;
    skip?: number;
    take?: number;
  }) {
    return prisma.payment.findMany({
      where: {
        loanId,
        ...(options?.status && { status: options.status as any }),
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: 'desc' },
      include: {
        installment: true,
      },
    });
  }

  async count(where?: Prisma.PaymentWhereInput) {
    return prisma.payment.count({ where });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return prisma.payment.create({
      data,
      include: {
        loan: true,
        installment: true,
        user: true,
      },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        loan: true,
        installment: true,
        user: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.payment.delete({
      where: { id },
    });
  }

  async paginate(options: {
    where?: Prisma.PaymentWhereInput;
    page: number;
    limit: number;
    orderBy?: Prisma.PaymentOrderByWithRelationInput;
    include?: Prisma.PaymentInclude;
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

  // Get total paid amount for a loan
  async getTotalPaidByLoanId(loanId: string): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        loanId,
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    });
    
    return Number(result._sum.amount || 0);
  }
}

export const paymentRepository = new PaymentRepository();

