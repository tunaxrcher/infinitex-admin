// src/features/loans/repositories/installmentRepository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';

export class InstallmentRepository {
  async findMany(options: {
    where?: Prisma.LoanInstallmentWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.LoanInstallmentOrderByWithRelationInput;
    include?: Prisma.LoanInstallmentInclude;
  }) {
    return prisma.loanInstallment.findMany(options);
  }

  async findById(id: string, include?: Prisma.LoanInstallmentInclude) {
    return prisma.loanInstallment.findUnique({
      where: { id },
      include,
    });
  }

  async findByLoanId(loanId: string) {
    return prisma.loanInstallment.findMany({
      where: { loanId },
      orderBy: { installmentNumber: 'asc' },
      include: {
        payments: true,
      },
    });
  }

  async findUnpaidByLoanId(loanId: string) {
    return prisma.loanInstallment.findMany({
      where: {
        loanId,
        isPaid: false,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOverdueInstallments() {
    return prisma.loanInstallment.findMany({
      where: {
        isPaid: false,
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        loan: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async count(where?: Prisma.LoanInstallmentWhereInput) {
    return prisma.loanInstallment.count({ where });
  }

  async create(data: Prisma.LoanInstallmentCreateInput) {
    return prisma.loanInstallment.create({ data });
  }

  async update(id: string, data: Prisma.LoanInstallmentUpdateInput) {
    return prisma.loanInstallment.update({
      where: { id },
      data,
    });
  }

  async markAsPaid(id: string, paidAmount: number, paidDate: Date) {
    return prisma.loanInstallment.update({
      where: { id },
      data: {
        isPaid: true,
        paidAmount,
        paidDate,
      },
    });
  }

  async updateLateFee(id: string, lateFee: number, lateDays: number) {
    return prisma.loanInstallment.update({
      where: { id },
      data: {
        isLate: true,
        lateFee,
        lateDays,
      },
    });
  }
}

export const installmentRepository = new InstallmentRepository();

