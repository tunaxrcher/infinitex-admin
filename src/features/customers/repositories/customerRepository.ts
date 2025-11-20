// src/features/customers/repositories/customerRepository.ts
import { prisma } from '@src/shared/lib/db';

export const customerRepository = {
  /**
   * Search customers by phone number, first name, or last name
   */
  searchCustomers: async (query: string, limit: number = 10) => {
    return prisma.user.findMany({
      where: {
        userType: 'CUSTOMER',
        OR: [
          { phoneNumber: { contains: query } },
          { profile: { firstName: { contains: query } } },
          { profile: { lastName: { contains: query } } },
        ],
      },
      include: {
        profile: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

