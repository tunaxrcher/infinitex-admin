// src/features/real-investment/services/server.ts
import 'server-only';

import { realInvestmentRepository } from '../repositories/realInvestmentRepository';
import { type InvestmentUpdateSchema } from '../validations';

export const realInvestmentService = {
  async getCurrent() {
    return await realInvestmentRepository.getCurrent();
  },

  async update(data: InvestmentUpdateSchema) {
    const current = await realInvestmentRepository.getCurrent();
    let newInvestment: number;

    switch (data.operation) {
      case 'edit':
        newInvestment = data.amount;
        break;
      case 'add':
        newInvestment = Number(current.investment) + data.amount;
        break;
      case 'subtract':
        newInvestment = Number(current.investment) - data.amount;
        if (newInvestment < 0) {
          throw new Error('ทุนไม่สามารถติดลบได้');
        }
        break;
      default:
        throw new Error('การดำเนินการไม่ถูกต้อง');
    }

    return await realInvestmentRepository.update(current.id, newInvestment);
  },
};

