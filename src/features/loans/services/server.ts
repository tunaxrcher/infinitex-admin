// src/features/loans/services/server.ts
import 'server-only';

import { loanRepository } from '../repositories/loanRepository';
import { type LoanCreateSchema, type LoanUpdateSchema, type LoanFiltersSchema } from '../validations';
import { Prisma } from '@prisma/client';

// Helper function to generate unique loan number
function generateLoanNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LOA${timestamp}${random}`;
}

export const loanService = {
  async getList(filters: LoanFiltersSchema) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: Prisma.LoanWhereInput = {};

    if (search) {
      where.OR = [
        { loanNumber: { contains: search } },
        { customer: { profile: { firstName: { contains: search } } } },
        { customer: { profile: { lastName: { contains: search } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Build orderBy
    const orderBy: Prisma.LoanOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    return loanRepository.paginate({
      where,
      page,
      limit,
      orderBy,
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        application: true,
      },
    });
  },

  async getById(id: string) {
    const loan = await loanRepository.findById(id, {
      customer: {
        include: {
          profile: true,
        },
      },
      application: true,
      installments: {
        orderBy: {
          installmentNumber: 'asc',
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    });

    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    return loan;
  },

  async create(data: LoanCreateSchema) {
    // ตรวจสอบข้อมูลซ้ำ
    // const existingLoan = await loanRepository.findMany({
    //   where: { loanNumber: data.loanNumber },
    // });
    // if (existingLoan.length > 0) {
    //   throw new Error('เลขที่สินเชื่อนี้มีอยู่แล้ว');
    // }

    // สร้างหมายเลขสินเชื่อ
    const loanNumber = generateLoanNumber();

    // คำนวณข้อมูลสินเชื่อ
    const { loanAmount, loanYears, interestRate } = data;
    const termMonths = loanYears * 12;
    const r = (interestRate / 100) / 12; // อัตราดอกเบี้ยต่อเดือน
    const n = termMonths;
    
    // คำนวณงวดชำระรายเดือน (PMT formula)
    let monthlyPayment = 0;
    if (interestRate > 0) {
      monthlyPayment = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
    } else {
      monthlyPayment = loanAmount / n;
    }

    const contractDate = new Date(data.loanStartDate);
    const expiryDate = new Date(data.loanDueDate);
    
    // คำนวณวันชำระงวดแรก (1 เดือนหลังจากวันทำสัญญา)
    const nextPaymentDate = new Date(contractDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    // Note: ในความเป็นจริง ต้องสร้าง User และ LoanApplication ก่อน
    // แต่สำหรับ demo นี้ จะใช้ hardcoded customerId
    // TODO: สร้างระบบจัดการลูกค้าและคำขอสินเชื่อ
    
    // สร้างสินเชื่อ
    const loan = await loanRepository.create({
      loanNumber,
      loanType: 'HOUSE_LAND_MORTGAGE',
      status: 'ACTIVE',
      principalAmount: loanAmount,
      interestRate: interestRate,
      termMonths,
      monthlyPayment,
      currentInstallment: 0,
      totalInstallments: termMonths,
      remainingBalance: loanAmount * (1 + (interestRate / 100)),
      nextPaymentDate,
      contractDate,
      expiryDate,
      titleDeedNumber: data.landNumber,
      // Temporary: จะต้องสร้างระบบจัดการลูกค้าและคำขอสินเชื่อจริง
      customer: {
        connectOrCreate: {
          where: { phoneNumber: data.phoneNumber },
          create: {
            phoneNumber: data.phoneNumber,
            userType: 'CUSTOMER',
            profile: {
              create: {
                firstName: data.fullName.split(' ')[0] || data.fullName,
                lastName: data.fullName.split(' ').slice(1).join(' ') || '',
                idCardNumber: data.idCard.replace(/\D/g, ''),
                dateOfBirth: data.birthDate ? new Date(data.birthDate) : null,
                address: data.address,
                email: data.email || null,
              },
            },
          },
        },
      },
      application: {
        create: {
          loanType: 'HOUSE_LAND_MORTGAGE',
          status: 'APPROVED',
          currentStep: 4,
          requestedAmount: loanAmount,
          approvedAmount: loanAmount,
          landNumber: data.landNumber,
          propertyLocation: data.placeName,
          propertyArea: data.landArea,
          customer: {
            connectOrCreate: {
              where: { phoneNumber: data.phoneNumber },
              create: {
                phoneNumber: data.phoneNumber,
                userType: 'CUSTOMER',
              },
            },
          },
        },
      },
    });

    return loan;
  },

  async update(id: string, data: LoanUpdateSchema) {
    // ตรวจสอบว่ามีสินเชื่อนี้อยู่หรือไม่
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // คำนวณข้อมูลใหม่ถ้ามีการเปลี่ยนแปลง
    let monthlyPayment = existing.monthlyPayment;
    let termMonths = existing.termMonths;
    let remainingBalance = existing.remainingBalance;

    if (data.loanAmount || data.loanYears || data.interestRate) {
      const loanAmount = data.loanAmount ?? Number(existing.principalAmount);
      const loanYears = data.loanYears ?? (existing.termMonths / 12);
      const interestRate = data.interestRate ?? Number(existing.interestRate);
      
      termMonths = loanYears * 12;
      const r = (interestRate / 100) / 12;
      const n = termMonths;
      
      if (interestRate > 0) {
        monthlyPayment = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
      } else {
        monthlyPayment = loanAmount / n;
      }

      remainingBalance = loanAmount * (1 + (interestRate / 100));
    }

    const updateData: Prisma.LoanUpdateInput = {
      ...(data.loanAmount && { principalAmount: data.loanAmount }),
      ...(data.interestRate && { interestRate: data.interestRate }),
      ...(data.loanYears && { 
        termMonths,
        totalInstallments: termMonths,
      }),
      monthlyPayment,
      remainingBalance,
      ...(data.loanStartDate && { contractDate: new Date(data.loanStartDate) }),
      ...(data.loanDueDate && { expiryDate: new Date(data.loanDueDate) }),
      ...(data.landNumber && { titleDeedNumber: data.landNumber }),
      updatedAt: new Date(),
    };

    // Update customer profile if needed
    if (data.fullName || data.email || data.address || data.birthDate) {
      updateData.customer = {
        update: {
          profile: {
            update: {
              ...(data.fullName && {
                firstName: data.fullName.split(' ')[0] || data.fullName,
                lastName: data.fullName.split(' ').slice(1).join(' ') || '',
              }),
              ...(data.email && { email: data.email }),
              ...(data.address && { address: data.address }),
              ...(data.birthDate && { dateOfBirth: new Date(data.birthDate) }),
            },
          },
        },
      };
    }

    return loanRepository.update(id, updateData);
  },

  async delete(id: string) {
    // ตรวจสอบว่ามีสินเชื่อนี้อยู่หรือไม่
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // Soft delete - เปลี่ยนสถานะเป็น CANCELLED แทนการลบ
    return loanRepository.update(id, {
      status: 'CANCELLED',
      updatedAt: new Date(),
    });
  },
};

