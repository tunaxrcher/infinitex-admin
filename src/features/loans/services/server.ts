// src/features/loans/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';
import { loanRepository } from '../repositories/loanRepository';
import {
  type LoanCreateSchema,
  type LoanFiltersSchema,
  type LoanUpdateSchema,
} from '../validations';

// Helper function to generate unique loan number
function generateLoanNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
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
    // สร้างหมายเลขสินเชื่อ
    const loanNumber = generateLoanNumber();

    // คำนวณข้อมูลสินเชื่อ
    const { loanAmount, loanYears, interestRate } = data;
    const termMonths = loanYears * 12;
    const r = interestRate / 100 / 12; // อัตราดอกเบี้ยต่อเดือน
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

    // Use transaction to ensure data consistency
    const loan = await prisma.$transaction(async (tx) => {
      // Step 1: ตรวจสอบและสร้าง User (Customer) ที่ตาราง users
      let customer = await tx.user.findUnique({
        where: { phoneNumber: data.phoneNumber },
        include: { profile: true },
      });

      if (!customer) {
        // สร้าง User ใหม่ในตาราง users
        customer = await tx.user.create({
          data: {
            phoneNumber: data.phoneNumber,
            userType: 'CUSTOMER',
          },
          include: { profile: true },
        });
      }

      // Step 2: สร้างหรืออัพเดท UserProfile ที่ตาราง user_profiles
      if (customer.profile) {
        // อัพเดท profile ที่มีอยู่
        await tx.userProfile.update({
          where: { userId: customer.id },
          data: {
            firstName: data.fullName.split(' ')[0] || data.fullName,
            lastName: data.fullName.split(' ').slice(1).join(' ') || '',
            idCardNumber: data.idCard.replace(/\D/g, ''),
            dateOfBirth: data.birthDate ? new Date(data.birthDate) : null,
            address: data.address,
            email: data.email || null,
          },
        });
      } else {
        // สร้าง profile ใหม่
        await tx.userProfile.create({
          data: {
            userId: customer.id,
            firstName: data.fullName.split(' ')[0] || data.fullName,
            lastName: data.fullName.split(' ').slice(1).join(' ') || '',
            idCardNumber: data.idCard.replace(/\D/g, ''),
            dateOfBirth: data.birthDate ? new Date(data.birthDate) : null,
            address: data.address,
            email: data.email || null,
          },
        });
      }

      // Step 3: สร้าง LoanApplication (สถานะอนุมัติแล้ว)
      const application = await tx.loanApplication.create({
        data: {
          loanType: 'HOUSE_LAND_MORTGAGE',
          status: 'APPROVED', // เริ่มต้นเป็น APPROVED (อนุมัติแล้ว)
          currentStep: 4,
          requestedAmount: loanAmount,
          approvedAmount: loanAmount,
          landNumber: data.landNumber,
          ownerName: data.ownerName || data.fullName,
          propertyLocation: data.placeName,
          propertyArea: data.landArea,
          customerId: customer.id,
        },
      });

      // Step 4: สร้าง Loan (สถานะ ACTIVE)
      const newLoan = await tx.loan.create({
        data: {
          loanNumber,
          loanType: 'HOUSE_LAND_MORTGAGE',
          status: 'ACTIVE', // เริ่มเป็น ACTIVE (ยังไม่ถึงกำหนด)
          principalAmount: loanAmount,
          interestRate: interestRate,
          termMonths,
          monthlyPayment,
          currentInstallment: 0,
          totalInstallments: termMonths,
          remainingBalance: loanAmount * (1 + interestRate / 100),
          nextPaymentDate,
          contractDate,
          expiryDate,
          titleDeedNumber: data.landNumber,
          customerId: customer.id,
          applicationId: application.id,
        },
        include: {
          customer: {
            include: {
              profile: true,
            },
          },
          application: true,
        },
      });

      // Step 5: สร้างตารางผ่อนชำระ (LoanInstallments)
      const totalLoanAmount = loanAmount * (1 + interestRate / 100);
      const installmentsData = [];

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(contractDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // คำนวณดอกเบี้ยและเงินต้นในแต่ละงวด
        const interestAmount = (loanAmount * interestRate) / 100 / termMonths;
        const principalAmount = monthlyPayment - interestAmount;

        installmentsData.push({
          loanId: newLoan.id,
          installmentNumber: i,
          dueDate,
          principalAmount,
          interestAmount,
          totalAmount: monthlyPayment,
          isPaid: false,
          isLate: false,
        });
      }

      await tx.loanInstallment.createMany({
        data: installmentsData,
      });

      return newLoan;
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
    let monthlyPayment = Number(existing.monthlyPayment);
    let termMonths = existing.termMonths;
    let remainingBalance = Number(existing.remainingBalance);

    if (data.loanAmount || data.loanYears || data.interestRate) {
      const loanAmount = data.loanAmount ?? Number(existing.principalAmount);
      const loanYears = data.loanYears ?? existing.termMonths / 12;
      const interestRate = data.interestRate ?? Number(existing.interestRate);

      termMonths = loanYears * 12;
      const r = interestRate / 100 / 12;
      const n = termMonths;

      if (interestRate > 0) {
        monthlyPayment = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
      } else {
        monthlyPayment = loanAmount / n;
      }

      remainingBalance = loanAmount * (1 + interestRate / 100);
    }

    // Use transaction for update
    return prisma.$transaction(async (tx) => {
      // Step 1: Update Loan
      const updateData: Prisma.LoanUpdateInput = {
        ...(data.loanAmount && { principalAmount: data.loanAmount }),
        ...(data.interestRate && { interestRate: data.interestRate }),
        ...(data.loanYears && {
          termMonths,
          totalInstallments: termMonths,
        }),
        monthlyPayment,
        remainingBalance,
        ...(data.loanStartDate && {
          contractDate: new Date(data.loanStartDate),
        }),
        ...(data.loanDueDate && { expiryDate: new Date(data.loanDueDate) }),
        ...(data.landNumber && { titleDeedNumber: data.landNumber }),
        updatedAt: new Date(),
      };

      const updatedLoan = await tx.loan.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            include: {
              profile: true,
            },
          },
          application: true,
        },
      });

      // Step 2: Update UserProfile ในตาราง user_profiles (ถ้ามีการเปลี่ยนแปลง)
      if (data.fullName || data.email || data.address || data.birthDate) {
        const profileData: any = {};

        if (data.fullName) {
          profileData.firstName = data.fullName.split(' ')[0] || data.fullName;
          profileData.lastName =
            data.fullName.split(' ').slice(1).join(' ') || '';
        }
        if (data.email) profileData.email = data.email;
        if (data.address) profileData.address = data.address;
        if (data.birthDate) profileData.dateOfBirth = new Date(data.birthDate);
        if (data.idCard)
          profileData.idCardNumber = data.idCard.replace(/\D/g, '');

        // อัพเดท UserProfile
        await tx.userProfile.update({
          where: { userId: existing.customerId },
          data: profileData,
        });
      }

      // Step 3: Update User phone number (ถ้ามีการเปลี่ยนแปลง)
      if (
        data.phoneNumber &&
        data.phoneNumber !== existing.customer?.phoneNumber
      ) {
        await tx.user.update({
          where: { id: existing.customerId },
          data: {
            phoneNumber: data.phoneNumber,
          },
        });
      }

      // Step 4: Update LoanApplication (ถ้ามีการเปลี่ยนแปลง)
      if (
        data.ownerName ||
        data.placeName ||
        data.landArea ||
        data.landNumber
      ) {
        await tx.loanApplication.update({
          where: { id: existing.applicationId },
          data: {
            ...(data.ownerName && { ownerName: data.ownerName }),
            ...(data.placeName && { propertyLocation: data.placeName }),
            ...(data.landArea && { propertyArea: data.landArea }),
            ...(data.landNumber && { landNumber: data.landNumber }),
          },
        });
      }

      return updatedLoan;
    });
  },

  async approve(id: string) {
    // ตรวจสอบว่ามีสินเชื่อนี้อยู่หรือไม่
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // ตรวจสอบสถานะ - ต้องเป็นรออนุมัติ (DRAFT, SUBMITTED, UNDER_REVIEW)
    const currentStatus = existing.application?.status;
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(currentStatus)) {
      throw new Error('สินเชื่อนี้ไม่สามารถอนุมัติได้');
    }

    return prisma.$transaction(async (tx) => {
      // อัพเดท LoanApplication
      await tx.loanApplication.update({
        where: { id: existing.applicationId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          // reviewedBy: adminId, // TODO: เพิ่ม admin authentication
        },
      });

      // อัพเดท Loan status เป็น ACTIVE
      await tx.loan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      return { success: true };
    });
  },

  async reject(id: string, reviewNotes: string) {
    // ตรวจสอบว่ามีสินเชื่อนี้อยู่หรือไม่
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // ตรวจสอบสถานะ - ต้องเป็นรออนุมัติ
    const currentStatus = existing.application?.status;
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(currentStatus)) {
      throw new Error('สินเชื่อนี้ไม่สามารถยกเลิกได้');
    }

    return prisma.$transaction(async (tx) => {
      // อัพเดท LoanApplication
      await tx.loanApplication.update({
        where: { id: existing.applicationId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewNotes: reviewNotes,
          // reviewedBy: adminId, // TODO: เพิ่ม admin authentication
        },
      });

      // อัพเดท Loan status เป็น CANCELLED
      await tx.loan.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      return { success: true };
    });
  },

  async delete(id: string) {
    // ตรวจสอบว่ามีสินเชื่อนี้อยู่หรือไม่
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // Hard delete - ลบจริงจาก database
    return prisma.$transaction(async (tx) => {
      // 1. ลบ Loan Installments ก่อน (ถ้ามี)
      await tx.loanInstallment.deleteMany({
        where: { loanId: id },
      });

      // 2. ลบ Payments ที่เกี่ยวข้อง (ถ้ามี)
      await tx.payment.deleteMany({
        where: { loanId: id },
      });

      // 3. ลบ Loan
      await tx.loan.delete({
        where: { id },
      });

      // 4. ลบ LoanApplication
      await tx.loanApplication.delete({
        where: { id: existing.applicationId },
      });

      return { success: true };
    });
  },

  async generateInstallments(id: string) {
    // ตรวจสอบว่ามีสินเชื่อนี้อยู่หรือไม่
    const loan = await this.getById(id);
    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // ตรวจสอบว่ามี installments อยู่แล้วหรือไม่
    const existingInstallments = await prisma.loanInstallment.count({
      where: { loanId: id },
    });

    if (existingInstallments > 0) {
      throw new Error('สินเชื่อนี้มีตารางผ่อนชำระอยู่แล้ว');
    }

    // สร้างตารางผ่อนชำระ
    const loanAmount = Number(loan.principalAmount);
    const interestRate = Number(loan.interestRate);
    const termMonths = loan.termMonths;
    const monthlyPayment = Number(loan.monthlyPayment);
    const contractDate = new Date(loan.contractDate);

    const installmentsData = [];

    for (let i = 1; i <= termMonths; i++) {
      const dueDate = new Date(contractDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      // คำนวณดอกเบี้ยและเงินต้นในแต่ละงวด
      const interestAmount = (loanAmount * interestRate) / 100 / termMonths;
      const principalAmount = monthlyPayment - interestAmount;

      installmentsData.push({
        loanId: id,
        installmentNumber: i,
        dueDate,
        principalAmount,
        interestAmount,
        totalAmount: monthlyPayment,
        isPaid: false,
        isLate: false,
      });
    }

    await prisma.loanInstallment.createMany({
      data: installmentsData,
    });

    // ดึงข้อมูลใหม่พร้อม installments
    return this.getById(id);
  },
};
