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
    /**
     * Generate phone number with given prefix
     */
    const generatePhoneWithPrefix = async (
      prefix: string,
    ): Promise<string | null> => {
      // Start from the smallest number
      let counter = 1;
      const maxAttempts = 100000; // Prevent infinite loop

      while (counter <= maxAttempts) {
        // Generate phone number: prefix + padded counter
        // e.g., "10" + "00000001" = "1000000001" (10 digits total)
        const phoneNumber = `${prefix}${counter.toString().padStart(8, '0')}`;

        // Check if phone number already exists
        const exists = await prisma.user.findUnique({
          where: { phoneNumber },
          select: { id: true },
        });

        if (!exists) {
          console.log(
            '[CustomerService] Found available phone number:',
            phoneNumber,
          );
          return phoneNumber;
        }

        counter++;
      }

      return null; // Could not find available number with this prefix
    };

    // Try prefix "10" first
    let phoneNumber = await generatePhoneWithPrefix('10');

    // If "10" prefix is full, try "20"
    if (!phoneNumber) {
      console.log('[CustomerService] Prefix "10" is full, trying "20"...');
      phoneNumber = await generatePhoneWithPrefix('20');
    }

    // If both prefixes are full, try "30" as fallback
    if (!phoneNumber) {
      console.log('[CustomerService] Prefix "20" is full, trying "30"...');
      phoneNumber = await generatePhoneWithPrefix('30');
    }

    if (!phoneNumber) {
      throw new Error('ไม่สามารถสร้างเบอร์โทรศัพท์ได้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    return phoneNumber;
  },
};
