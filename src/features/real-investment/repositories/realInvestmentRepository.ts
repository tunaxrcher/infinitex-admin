// src/features/real-investment/repositories/realInvestmentRepository.ts
import { prisma } from '@src/shared/lib/db';

export class RealInvestmentRepository {
  async getCurrent() {
    // Get first record or create if doesn't exist
    const investment = await prisma.realInvestment.findFirst({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!investment) {
      // Create initial record with 0 investment
      return await prisma.realInvestment.create({
        data: {
          investment: 0,
        },
      });
    }

    return investment;
  }

  async update(id: string, investment: number) {
    return await prisma.realInvestment.update({
      where: { id },
      data: {
        investment,
        updatedAt: new Date(),
      },
    });
  }
}

export const realInvestmentRepository = new RealInvestmentRepository();

