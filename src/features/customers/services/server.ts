// src/features/customers/services/server.ts
import { prisma } from '@src/shared/lib/db';
import { customerRepository } from '../repositories/customerRepository';

export const customerService = {
  /**
   * Search customers by query string
   */
  searchCustomers: async (query: string = '', limit: number = 10) => {
    return customerRepository.searchCustomers(query, limit);
  },

  /**
   * Generate a unique phone number for customers who don't want to provide their number
   * Starts with "10" (e.g., 1000000001), if exists, try "20", then "30"
   */
  generateUniquePhoneNumber: async (): Promise<string> => {
    const prefixes = ['10', '20', '30'];
    const maxAttempts = 100000;

    for (const prefix of prefixes) {
      // Find the highest phone number with this prefix
      const lastPhone = await prisma.user.findFirst({
        where: {
          phoneNumber: {
            startsWith: prefix,
          },
        },
        orderBy: {
          phoneNumber: 'desc',
        },
        select: { phoneNumber: true },
      });

      // Start counter from the next available number
      const startCounter = lastPhone
        ? parseInt(lastPhone.phoneNumber.substring(2)) + 1
        : 1;

      // Try to find an available number
      for (let counter = startCounter; counter <= maxAttempts; counter++) {
        const phoneNumber = `${prefix}${counter.toString().padStart(8, '0')}`;

        // Double-check availability
        const exists = await prisma.user.findUnique({
          where: { phoneNumber },
          select: { id: true },
        });

        if (!exists) {
          console.log(
            `[CustomerService] Generated phone number: ${phoneNumber}`,
          );
          return phoneNumber;
        }
      }

      console.log(
        `[CustomerService] Prefix "${prefix}" is full, trying next...`,
      );
    }

    throw new Error('ไม่สามารถสร้างเบอร์โทรศัพท์ได้ กรุณาติดต่อผู้ดูแลระบบ');
  },
};
