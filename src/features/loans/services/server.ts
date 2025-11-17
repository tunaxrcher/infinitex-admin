// src/features/loans/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@src/shared/lib/db';
import { installmentRepository } from '../repositories/installmentRepository';
import { loanRepository } from '../repositories/loanRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import {
  type CloseLoanSchema,
  type LoanCreateSchema,
  type LoanFiltersSchema,
  type LoanUpdateSchema,
  type PayInstallmentSchema,
  type PaymentCreateSchema,
  type PaymentFiltersSchema,
  type VerifyPaymentSchema,
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

    // Query จาก loan_applications เป็นหลัก เพื่อให้แสดงทั้งที่ยังไม่มี loan
    const where: Prisma.LoanApplicationWhereInput = {
      // ไม่แสดง DRAFT
      status: {
        not: 'DRAFT',
      },
    };

    // Search filter
    if (search) {
      const searchConditions: Prisma.LoanApplicationWhereInput[] = [
        // ค้นหาจากชื่อลูกค้า
        { customer: { profile: { firstName: { contains: search } } } },
        { customer: { profile: { lastName: { contains: search } } } },
        // ค้นหาจากที่ตั้งทรัพย์สิน
        { propertyLocation: { contains: search } },
        { ownerName: { contains: search } },
      ];

      // ค้นหาจากเลขที่สินเชื่อ (ใน loan) - รวม status filter ด้วยถ้ามี
      const loanSearchCondition: Prisma.LoanWhereInput = {
        loanNumber: { contains: search },
      };
      if (status) {
        loanSearchCondition.status = status;
      }
      searchConditions.push({ loan: loanSearchCondition });

      // ถ้า search เป็นตัวเลข ให้ค้นหาจากยอดเงินด้วย
      const searchNumber = parseFloat(search.replace(/,/g, ''));
      if (!isNaN(searchNumber)) {
        searchConditions.push(
          { requestedAmount: { equals: searchNumber } },
          { approvedAmount: { equals: searchNumber } },
        );

        // ค้นหาจาก principal amount ใน loan - รวม status filter ด้วยถ้ามี
        const amountSearchCondition: Prisma.LoanWhereInput = {
          principalAmount: { equals: searchNumber },
        };
        if (status) {
          amountSearchCondition.status = status;
        }
        searchConditions.push({ loan: amountSearchCondition });
      }

      where.OR = searchConditions;
    } else if (status) {
      // ถ้าไม่มี search แต่มี status filter
      where.loan = {
        status: status,
      };
    }

    // Build orderBy - เรียงตามวันที่ขอ (createdAt) เป็นค่าเริ่มต้น
    const orderBy: Prisma.LoanApplicationOrderByWithRelationInput =
      sortBy === 'createdAt'
        ? {
            createdAt: sortOrder,
          }
        : {
            [sortBy]: sortOrder,
            createdAt: 'desc', // เพิ่มการเรียงตาม createdAt เป็น secondary
          };

    // Query applications with pagination
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: {
            include: {
              profile: true,
            },
          },
          agent: true, // เพิ่ม agent
          loan: {
            include: {
              installments: {
                orderBy: {
                  installmentNumber: 'asc',
                },
                take: 1, // เอาแค่งวดแรกเพื่อประหยัด
              },
            },
          },
        },
      }),
      prisma.loanApplication.count({ where }),
    ]);

    // แปลงข้อมูลให้เป็นรูปแบบเดียวกับ Loan และตรวจสอบ overdue
    const transformedData = await Promise.all(
      applications.map(async (app) => {
        // ถ้ามี loan ให้ใช้ข้อมูลจาก loan
        if (app.loan) {
          // ตรวจสอบว่ามีงวดค้างชำระหรือไม่
          const overdueInstallments = await prisma.loanInstallment.findMany({
            where: {
              loanId: app.loan.id,
              isPaid: false,
              dueDate: {
                lt: new Date(),
              },
            },
            orderBy: {
              dueDate: 'asc',
            },
          });

          return {
            ...app.loan,
            application: app,
            customer: app.customer,
            // เพิ่มข้อมูล overdue
            hasOverdueInstallments: overdueInstallments.length > 0,
            overdueCount: overdueInstallments.length,
            oldestOverdueDate: overdueInstallments[0]?.dueDate || null,
          };
        }

        // ถ้ายังไม่มี loan ให้สร้างข้อมูลจาก application
        return {
          id: app.id,
          loanNumber: `APP-${app.id.slice(0, 8).toUpperCase()}`, // ใช้ application ID เป็น temporary loan number
          customerId: app.customerId,
          customer: app.customer,
          agentId: app.agentId,
          agent: app.agent,
          applicationId: app.id,
          application: app,
          loanType: app.loanType,
          status: app.status as any, // ใช้ application status แทน
          principalAmount: app.approvedAmount || app.requestedAmount || 0,
          interestRate: 0, // ยังไม่มีข้อมูล
          termMonths: 0,
          monthlyPayment: 0,
          currentInstallment: 0,
          totalInstallments: 0,
          remainingBalance: app.approvedAmount || app.requestedAmount || 0,
          nextPaymentDate: new Date(),
          contractDate: app.createdAt,
          expiryDate: app.createdAt,
          titleDeedNumber: app.landNumber,
          collateralValue: app.propertyValue,
          collateralDetails: null,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          payments: [],
          installments: [],
          hasOverdueInstallments: false,
          overdueCount: 0,
          oldestOverdueDate: null,
        };
      }),
    );

    return {
      data: transformedData,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    // ลองหา loan ก่อน
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

    if (loan) {
      return loan;
    }

    // ถ้าไม่เจอ loan ให้ลองหาจาก application
    const application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        agent: true, // เพิ่ม agent
        loan: {
          include: {
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
          },
        },
      },
    });

    if (!application) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // ถ้ามี loan ใน application ให้ return loan
    if (application.loan) {
      return {
        ...application.loan,
        application,
        customer: application.customer,
      };
    }

    // ถ้ายังไม่มี loan ให้สร้างข้อมูลจาก application
    return {
      id: application.id,
      loanNumber: `APP-${application.id.slice(0, 8).toUpperCase()}`,
      customerId: application.customerId,
      customer: application.customer,
      agentId: application.agentId,
      agent: application.agent,
      applicationId: application.id,
      application: application,
      loanType: application.loanType,
      status: application.status as any,
      principalAmount:
        application.approvedAmount || application.requestedAmount || 0,
      interestRate: 0,
      termMonths: 0,
      monthlyPayment: 0,
      currentInstallment: 0,
      totalInstallments: 0,
      remainingBalance:
        application.approvedAmount || application.requestedAmount || 0,
      nextPaymentDate: new Date(),
      contractDate: application.createdAt,
      expiryDate: application.createdAt,
      titleDeedNumber: application.landNumber,
      collateralValue: application.propertyValue,
      collateralDetails: null,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      payments: [],
      installments: [],
    };
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
      const requestedAmount = data.requestedAmount ?? loanAmount;
      const maxApprovedAmount = data.maxApprovedAmount ?? loanAmount * 1.5; // ค่า default = 150% ของยอดที่ขอ

      const application = await tx.loanApplication.create({
        data: {
          loanType: 'HOUSE_LAND_MORTGAGE',
          status: 'APPROVED', // เริ่มต้นเป็น APPROVED (อนุมัติแล้ว)
          currentStep: 4,
          requestedAmount: requestedAmount,
          approvedAmount: loanAmount,
          maxApprovedAmount: maxApprovedAmount,
          landNumber: data.landNumber,
          ownerName: data.ownerName || data.fullName,
          propertyLocation: data.placeName,
          propertyArea: data.landArea,
          propertyType: data.propertyType || 'ที่ดิน', // ค่า default
          propertyValue: data.propertyValue ?? loanAmount * 2, // ค่า default = 2 เท่าของยอดกู้
          customerId: customer.id,
          // บันทึกภาพโฉนด (ใช้ภาพแรกเป็นหลัก)
          titleDeedImage:
            data.titleDeedImages && data.titleDeedImages.length > 0
              ? data.titleDeedImages[0]
              : null,
          // บันทึกภาพเพิ่มเติม (supporting images)
          supportingImages: data.supportingImages || [],
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
      if (
        existing.customerId &&
        (data.fullName || data.email || data.address || data.birthDate)
      ) {
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
      if (existing.customerId && data.phoneNumber) {
        // Query current customer data
        const currentCustomer = await tx.user.findUnique({
          where: { id: existing.customerId },
        });

        if (
          currentCustomer &&
          data.phoneNumber !== currentCustomer.phoneNumber
        ) {
          await tx.user.update({
            where: { id: existing.customerId },
            data: {
              phoneNumber: data.phoneNumber,
            },
          });
        }
      }

      // Step 4: Update LoanApplication (ถ้ามีการเปลี่ยนแปลง)
      if (
        data.ownerName ||
        data.placeName ||
        data.landArea ||
        data.landNumber ||
        data.propertyType ||
        data.propertyValue !== undefined ||
        data.requestedAmount !== undefined ||
        data.maxApprovedAmount !== undefined ||
        data.loanAmount ||
        data.titleDeedImages ||
        data.supportingImages
      ) {
        const updateApplicationData: any = {
          ...(data.ownerName && { ownerName: data.ownerName }),
          ...(data.placeName && { propertyLocation: data.placeName }),
          ...(data.landArea && { propertyArea: data.landArea }),
          ...(data.landNumber && { landNumber: data.landNumber }),
          ...(data.propertyType && { propertyType: data.propertyType }),
          ...(data.propertyValue !== undefined && {
            propertyValue: data.propertyValue,
          }),
          ...(data.requestedAmount !== undefined && {
            requestedAmount: data.requestedAmount,
          }),
          ...(data.maxApprovedAmount !== undefined && {
            maxApprovedAmount: data.maxApprovedAmount,
          }),
          ...(data.loanAmount && { approvedAmount: data.loanAmount }),
        };

        // Update title deed image (แทนที่รูปเดิม)
        if (data.titleDeedImages && data.titleDeedImages.length > 0) {
          // รูปแรกเป็น titleDeedImage
          updateApplicationData.titleDeedImage = data.titleDeedImages[0];

          console.log('[Service] Replacing title deed image:', {
            titleDeedImage: updateApplicationData.titleDeedImage,
          });
        }

        // Update supporting images (แทนที่รูปเดิม)
        if (data.supportingImages !== undefined) {
          updateApplicationData.supportingImages = data.supportingImages;

          console.log('[Service] Replacing supporting images:', {
            supportingImagesCount: data.supportingImages.length,
          });
        }

        await tx.loanApplication.update({
          where: { id: existing.applicationId },
          data: updateApplicationData,
        });
      }

      return updatedLoan;
    });
  },

  async approve(id: string) {
    // ตรวจสอบว่ามี application อยู่หรือไม่ (id อาจเป็น loan id หรือ application id)
    let application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        agent: true,
        loan: true,
      },
    });

    // ถ้าไม่เจอ ให้ลองหาจาก loan
    if (!application) {
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: {
          application: {
            include: {
              customer: {
                include: {
                  profile: true,
                },
              },
              agent: true,
              loan: true,
            },
          },
        },
      });

      if (!loan) {
        throw new Error('ไม่พบข้อมูลสินเชื่อ');
      }

      application = loan.application;
    }

    // ตรวจสอบสถานะ - ต้องเป็นรออนุมัติ
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new Error('สินเชื่อนี้ไม่สามารถอนุมัติได้');
    }

    return prisma.$transaction(async (tx) => {
      // อัพเดท LoanApplication
      await tx.loanApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          approvedAmount: application.requestedAmount, // อนุมัติตามยอดที่ขอ
          // reviewedBy: adminId, // TODO: เพิ่ม admin authentication
        },
      });

      // ตรวจสอบว่ามี Loan record อยู่แล้วหรือไม่
      const existingLoan = await tx.loan.findUnique({
        where: { applicationId: application.id },
      });

      if (existingLoan) {
        // ถ้ามี loan แล้ว ให้ update status
        await tx.loan.update({
          where: { id: existingLoan.id },
          data: {
            status: 'ACTIVE',
            updatedAt: new Date(),
          },
        });
      } else {
        // ถ้ายังไม่มี loan ให้สร้างใหม่
        const loanNumber = generateLoanNumber();
        const loanAmount = Number(application.requestedAmount || 0);
        const interestRate = 1; // ดอกเบี้ย default 1%
        const loanYears = 4; // ระยะเวลา default 4 ปี
        const termMonths = loanYears * 12;
        const r = interestRate / 100 / 12;
        const n = termMonths;

        // คำนวณงวดชำระรายเดือน
        let monthlyPayment = 0;
        if (interestRate > 0) {
          monthlyPayment = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
        } else {
          monthlyPayment = loanAmount / n;
        }

        const contractDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + loanYears);

        const nextPaymentDate = new Date(contractDate);
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        // สร้าง Loan record
        const newLoan = await tx.loan.create({
          data: {
            loanNumber,
            loanType: application.loanType,
            status: 'ACTIVE',
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
            titleDeedNumber: application.landNumber,
            customerId: application.customerId,
            applicationId: application.id,
            agentId: application.agentId,
          },
        });

        // สร้างตารางผ่อนชำระ
        const installmentsData = [];
        for (let i = 1; i <= termMonths; i++) {
          const dueDate = new Date(contractDate);
          dueDate.setMonth(dueDate.getMonth() + i);

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
      }

      return { success: true };
    });
  },

  async reject(id: string, reviewNotes: string) {
    // ตรวจสอบว่ามี application อยู่หรือไม่ (id อาจเป็น loan id หรือ application id)
    let application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        agent: true,
        loan: true,
      },
    });

    // ถ้าไม่เจอ ให้ลองหาจาก loan
    if (!application) {
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: {
          application: {
            include: {
              customer: {
                include: {
                  profile: true,
                },
              },
              agent: true,
              loan: true,
            },
          },
        },
      });

      if (!loan) {
        throw new Error('ไม่พบข้อมูลสินเชื่อ');
      }

      application = loan.application;
    }

    // ตรวจสอบสถานะ - ต้องเป็นรออนุมัติ
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new Error('สินเชื่อนี้ไม่สามารถยกเลิกได้');
    }

    return prisma.$transaction(async (tx) => {
      // อัพเดท LoanApplication
      await tx.loanApplication.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewNotes: reviewNotes,
          // reviewedBy: adminId, // TODO: เพิ่ม admin authentication
        },
      });

      // ตรวจสอบว่ามี Loan record หรือไม่
      const existingLoan = await tx.loan.findUnique({
        where: { applicationId: application.id },
      });

      if (existingLoan) {
        // ถ้ามี loan แล้ว ให้ update status เป็น CANCELLED
        await tx.loan.update({
          where: { id: existingLoan.id },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });
      }
      // ถ้ายังไม่มี loan ก็ไม่ต้องทำอะไร (แค่ update application ก็พอ)

      return { success: true };
    });
  },

  async delete(id: string) {
    // ตรวจสอบว่ามี application อยู่หรือไม่ (id อาจเป็น loan id หรือ application id)
    let application = await prisma.loanApplication.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        agent: true,
        loan: true,
      },
    });

    let loanId: string | null = null;

    // ถ้าไม่เจอ ให้ลองหาจาก loan
    if (!application) {
      const loan = await prisma.loan.findUnique({
        where: { id },
        include: {
          application: {
            include: {
              customer: {
                include: {
                  profile: true,
                },
              },
              agent: true,
              loan: true,
            },
          },
        },
      });

      if (!loan) {
        throw new Error('ไม่พบข้อมูลสินเชื่อ');
      }

      application = loan.application;
      loanId = loan.id;
    } else if (application.loan) {
      loanId = application.loan.id;
    }

    // Hard delete - ลบจริงจาก database
    return prisma.$transaction(async (tx) => {
      // ถ้ามี loan record ให้ลบข้อมูลที่เกี่ยวข้อง
      if (loanId) {
        // 1. ลบ Loan Installments ก่อน (ถ้ามี)
        await tx.loanInstallment.deleteMany({
          where: { loanId: loanId },
        });

        // 2. ลบ Payments ที่เกี่ยวข้อง (ถ้ามี)
        await tx.payment.deleteMany({
          where: { loanId: loanId },
        });

        // 3. ลบ Loan
        await tx.loan.delete({
          where: { id: loanId },
        });
      }

      // 4. ลบ LoanApplication
      await tx.loanApplication.delete({
        where: { id: application.id },
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

// ============================================
// PAYMENT SERVICE
// ============================================

// Generate unique reference number for payment
function generateReferenceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `PAY${timestamp}${random}`;
}

// Calculate late fee based on days overdue
function calculateLateFee(
  originalAmount: number,
  daysLate: number,
  lateFeePerDay: number = 50,
): number {
  return daysLate * lateFeePerDay;
}

// Calculate days between two dates
function calculateDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export const paymentService = {
  /**
   * Get list of payments with filters and pagination
   */
  async getList(filters: PaymentFiltersSchema) {
    const where: Prisma.PaymentWhereInput = {};

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.loanId) {
      where.loanId = filters.loanId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod as any;
    }

    if (filters.search) {
      where.referenceNumber = {
        contains: filters.search,
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    return paymentRepository.paginate({
      where,
      page: filters.page || 1,
      limit: filters.limit || 10,
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          select: {
            loanNumber: true,
            principalAmount: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            phoneNumber: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        installment: {
          select: {
            installmentNumber: true,
            dueDate: true,
            totalAmount: true,
          },
        },
      },
    });
  },

  /**
   * Get payment by ID
   */
  async getById(id: string) {
    const payment = await paymentRepository.findById(id, {
      loan: {
        include: {
          customer: {
            include: {
              profile: true,
            },
          },
        },
      },
      installment: true,
      user: {
        include: {
          profile: true,
        },
      },
    });

    if (!payment) {
      throw new Error('ไม่พบข้อมูลการชำระเงิน');
    }

    return payment;
  },

  /**
   * Pay a specific installment
   */
  async payInstallment(data: PayInstallmentSchema, userId?: string) {
    const loan = await loanRepository.findById(data.loanId, {
      installments: true,
    });

    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    if (loan.status !== 'ACTIVE') {
      throw new Error('สินเชื่อไม่อยู่ในสถานะที่สามารถชำระได้');
    }

    // Use customer ID from loan as the payer
    const payerUserId = userId || loan.customerId;

    if (!payerUserId) {
      throw new Error('ไม่พบข้อมูลผู้ชำระเงิน');
    }

    const installment = await installmentRepository.findById(
      data.installmentId,
      {
        payments: true,
      },
    );

    if (!installment) {
      throw new Error('ไม่พบข้อมูลงวดชำระ');
    }

    if (installment.isPaid) {
      throw new Error('งวดนี้ชำระแล้ว');
    }

    if (installment.loanId !== data.loanId) {
      throw new Error('งวดชำระไม่ตรงกับสินเชื่อที่ระบุ');
    }

    const today = new Date();
    const dueDate = new Date(installment.dueDate);
    let totalAmount = Number(installment.totalAmount);
    let lateFee = 0;
    let daysLate = 0;
    let isLate = false;

    if (today > dueDate) {
      isLate = true;
      daysLate = calculateDaysBetween(dueDate, today);
      lateFee = data.includeLateFee
        ? data.lateFeeAmount || calculateLateFee(totalAmount, daysLate)
        : 0;

      await installmentRepository.updateLateFee(
        installment.id,
        lateFee,
        daysLate,
      );

      totalAmount += lateFee;
    }

    if (data.amount < totalAmount) {
      throw new Error(
        `จำนวนเงินไม่เพียงพอ ต้องชำระอย่างน้อย ${totalAmount.toLocaleString()} บาท`,
      );
    }

    const paidDate = new Date();

    const payment = await paymentRepository.create({
      user: { connect: { id: payerUserId } },
      loan: { connect: { id: data.loanId } },
      installment: { connect: { id: data.installmentId } },
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: 'COMPLETED',
      referenceNumber: generateReferenceNumber(),
      dueDate: installment.dueDate,
      paidDate: paidDate,
      principalAmount: Number(installment.principalAmount),
      interestAmount: Number(installment.interestAmount),
      feeAmount: lateFee,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      transactionId: data.transactionId,
    });

    // Mark installment as paid
    await installmentRepository.markAsPaid(
      data.installmentId,
      data.amount,
      paidDate,
    );

    // Update loan's current installment and remaining balance
    const currentInstallment = loan.currentInstallment + 1;
    const newRemainingBalance =
      Number(loan.remainingBalance) - Number(installment.principalAmount);

    await loanRepository.update(data.loanId, {
      currentInstallment,
      remainingBalance: Math.max(0, newRemainingBalance),
    });

    // Check if all installments are paid
    const unpaidCount = await installmentRepository.count({
      loanId: data.loanId,
      isPaid: false,
    });

    if (unpaidCount === 0) {
      // Mark loan as completed
      await loanRepository.update(data.loanId, {
        status: 'COMPLETED',
        remainingBalance: 0,
      });
    }

    return {
      payment,
      message: 'ชำระเงินสำเร็จ',
      totalAmount,
      lateFee,
      daysLate,
      isLate,
    };
  },

  /**
   * Close/Payoff the entire loan
   */
  async closeLoan(data: CloseLoanSchema, userId?: string) {
    const loan = await loanRepository.findById(data.loanId, {
      installments: true,
    });

    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    if (loan.status !== 'ACTIVE') {
      throw new Error('สินเชื่อไม่อยู่ในสถานะที่สามารถปิดได้');
    }

    // Use customer ID from loan as the payer
    const payerUserId = userId || loan.customerId;

    if (!payerUserId) {
      throw new Error('ไม่พบข้อมูลผู้ชำระเงิน');
    }

    const unpaidInstallments = await installmentRepository.findUnpaidByLoanId(
      data.loanId,
    );

    if (unpaidInstallments.length === 0) {
      throw new Error('สินเชื่อนี้ชำระครบแล้ว');
    }

    let totalPayoffAmount = unpaidInstallments.reduce((sum, inst) => {
      return sum + Number(inst.totalAmount);
    }, 0);

    const discount = data.discountAmount || 0;
    const additionalFees = data.additionalFees || 0;
    totalPayoffAmount = totalPayoffAmount - discount + additionalFees;

    const paidDate = new Date();

    const payment = await paymentRepository.create({
      user: { connect: { id: payerUserId } },
      loan: { connect: { id: data.loanId } },
      amount: totalPayoffAmount,
      paymentMethod: data.paymentMethod,
      status: 'COMPLETED',
      referenceNumber: generateReferenceNumber(),
      dueDate: paidDate,
      paidDate: paidDate,
      principalAmount: unpaidInstallments.reduce(
        (sum, inst) => sum + Number(inst.principalAmount),
        0,
      ),
      interestAmount: unpaidInstallments.reduce(
        (sum, inst) => sum + Number(inst.interestAmount),
        0,
      ),
      feeAmount: additionalFees,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      transactionId: data.transactionId,
    });

    // Mark all unpaid installments as paid
    await Promise.all(
      unpaidInstallments.map((inst) =>
        installmentRepository.markAsPaid(
          inst.id,
          Number(inst.totalAmount),
          paidDate,
        ),
      ),
    );

    // Mark loan as completed
    await loanRepository.update(data.loanId, {
      status: 'COMPLETED',
      remainingBalance: 0,
      currentInstallment: loan.totalInstallments,
    });

    return {
      payment,
      message: 'ปิดสินเชื่อสำเร็จ',
      totalPayoffAmount,
      unpaidInstallmentsCount: unpaidInstallments.length,
      discount,
      additionalFees,
    };
  },

  /**
   * Verify and complete a payment (admin function)
   */
  async verifyPayment(data: VerifyPaymentSchema) {
    const payment = await paymentRepository.findById(data.paymentId);

    if (!payment) {
      throw new Error('ไม่พบข้อมูลการชำระเงิน');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('การชำระเงินนี้ถูกดำเนินการแล้ว');
    }

    const paidDate = data.paidDate ? new Date(data.paidDate) : new Date();

    await paymentRepository.update(payment.id, {
      status: data.status,
      paidDate: data.status === 'COMPLETED' ? paidDate : null,
      transactionId: data.transactionId || payment.transactionId,
    });

    if (data.status === 'COMPLETED') {
      if (payment.installmentId && payment.loanId) {
        await installmentRepository.markAsPaid(
          payment.installmentId,
          Number(payment.amount),
          paidDate,
        );

        const loan = await loanRepository.findById(payment.loanId, {
          installments: true,
        });

        if (loan) {
          const currentInstallment = loan.currentInstallment + 1;
          const newRemainingBalance =
            Number(loan.remainingBalance) - Number(payment.principalAmount);

          await loanRepository.update(payment.loanId, {
            currentInstallment,
            remainingBalance: Math.max(0, newRemainingBalance),
          });

          const unpaidCount = await installmentRepository.count({
            loanId: payment.loanId,
            isPaid: false,
          });

          if (unpaidCount === 0) {
            await loanRepository.update(payment.loanId, {
              status: 'COMPLETED',
              remainingBalance: 0,
            });
          }
        }
      } else if (payment.loanId) {
        const unpaidInstallments =
          await installmentRepository.findUnpaidByLoanId(payment.loanId);

        await Promise.all(
          unpaidInstallments.map((inst) =>
            installmentRepository.markAsPaid(
              inst.id,
              Number(inst.totalAmount),
              paidDate,
            ),
          ),
        );

        await loanRepository.update(payment.loanId, {
          status: 'COMPLETED',
          remainingBalance: 0,
          currentInstallment: Number(
            (await loanRepository.findById(payment.loanId))
              ?.totalInstallments || 0,
          ),
        });
      }
    }

    return {
      message:
        data.status === 'COMPLETED'
          ? 'ยืนยันการชำระเงินสำเร็จ'
          : 'ปฏิเสธการชำระเงินสำเร็จ',
    };
  },

  /**
   * Get payment history for a loan
   */
  async getPaymentsByLoanId(loanId: string) {
    const payments = await paymentRepository.findByLoanId(loanId);
    const totalPaid = await paymentRepository.getTotalPaidByLoanId(loanId);

    return {
      payments,
      totalPaid,
    };
  },

  /**
   * Get upcoming payments for a user
   */
  async getUpcomingPayments(userId: string, limit: number = 5) {
    const loans = await loanRepository.findMany({
      where: {
        customerId: userId,
        status: 'ACTIVE',
      },
    });

    const loanIds = loans.map((loan) => loan.id);

    const upcomingInstallments = await prisma.loanInstallment.findMany({
      where: {
        loanId: { in: loanIds },
        isPaid: false,
        dueDate: {
          gte: new Date(),
        },
      },
      include: {
        loan: {
          select: {
            loanNumber: true,
            principalAmount: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });

    return upcomingInstallments;
  },

  /**
   * Get overdue payments for a user
   */
  async getOverduePayments(userId: string) {
    const loans = await loanRepository.findMany({
      where: {
        customerId: userId,
        status: 'ACTIVE',
      },
    });

    const loanIds = loans.map((loan) => loan.id);

    const overdueInstallments = await prisma.loanInstallment.findMany({
      where: {
        loanId: { in: loanIds },
        isPaid: false,
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        loan: {
          select: {
            loanNumber: true,
            principalAmount: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return overdueInstallments;
  },

  /**
   * Create a new payment record (for admin or manual entry)
   */
  async create(data: PaymentCreateSchema) {
    const loan = await loanRepository.findById(data.loanId);
    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    const referenceNumber = generateReferenceNumber();

    const payment = await paymentRepository.create({
      user: { connect: { id: data.userId } },
      loan: { connect: { id: data.loanId } },
      ...(data.installmentId && {
        installment: { connect: { id: data.installmentId } },
      }),
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: 'PENDING',
      referenceNumber,
      dueDate: new Date(data.dueDate),
      principalAmount: data.principalAmount || 0,
      interestAmount: data.interestAmount || 0,
      feeAmount: data.feeAmount || 0,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      qrCode: data.qrCode,
      barcodeNumber: data.barcodeNumber,
    });

    return payment;
  },

  /**
   * Delete a payment (only if pending)
   */
  async delete(id: string) {
    const payment = await paymentRepository.findById(id);

    if (!payment) {
      throw new Error('ไม่พบข้อมูลการชำระเงิน');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('ไม่สามารถลบรายการชำระเงินที่ดำเนินการแล้ว');
    }

    await paymentRepository.delete(id);

    return { message: 'ลบรายการชำระเงินสำเร็จ' };
  },
};
