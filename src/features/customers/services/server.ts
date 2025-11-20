// src/features/customers/services/server.ts
import { customerRepository } from '../repositories/customerRepository';

export const customerService = {
  /**
   * Search customers by query string
   */
  searchCustomers: async (query: string = '', limit: number = 10) => {
    return customerRepository.searchCustomers(query, limit);
  },
};

