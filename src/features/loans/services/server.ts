// src/features/loans/services/server.ts
import 'server-only';
import { Prisma } from '@prisma/client';
import amphurData from '@src/data/amphur.json';
import provinceData from '@src/data/province.json';
import { aiService } from '@src/shared/lib/ai-services';
import { prisma } from '@src/shared/lib/db';
import LandsMapsAPI from '@src/shared/lib/LandsMapsAPI';
import { storage } from '@src/shared/lib/storage';
import { installmentRepository } from '../repositories/installmentRepository';
import { loanRepository } from '../repositories/loanRepository';
import { paymentRepository } from '../repositories/paymentRepository';
import {
  ManualLookupSchema,
  type CloseLoanSchema,
  type LoanCreateSchema,
  type LoanFiltersSchema,
  type LoanUpdateSchema,
  type PayInstallmentSchema,
  type PaymentCreateSchema,
  type PaymentFiltersSchema,
  type VerifyPaymentSchema,
} from '../validations';

// ============================================
// HELPER FUNCTIONS (exported for reuse)
// ============================================

/**
 * Generate unique loan number
 * Format: LOA + timestamp(8 digits) + random(3 digits)
 */
export function generateLoanNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `LOA${timestamp}${random}`;
}

/**
 * Generate unique reference number for payment
 * Format: PAY + timestamp + random(4 digits)
 */
export function generateReferenceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `PAY${timestamp}${random}`;
}

/**
 * Calculate monthly payment (interest only, no principal)
 * Formula: Loan Amount × (Interest Rate / 100) / 12
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  interestRate: number,
): number {
  return (loanAmount * (interestRate / 100)) / 12;
}

/**
 * Calculate late fee based on days overdue
 */
export function calculateLateFee(
  originalAmount: number,
  daysLate: number,
  lateFeePerDay: number = 50,
): number {
  return daysLate * lateFeePerDay;
}

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate next payment date (1 month after contract date)
 */
export function calculateNextPaymentDate(contractDate: Date): Date {
  const nextDate = new Date(contractDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

/**
 * Calculate expiry date based on loan years
 */
export function calculateExpiryDate(
  contractDate: Date,
  loanYears: number,
): Date {
  const expiryDate = new Date(contractDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + loanYears);
  return expiryDate;
}

/**
 * Generate installments data for loan
 */
export function generateInstallmentsData(
  loanId: string,
  contractDate: Date,
  termMonths: number,
  monthlyPayment: number,
): Array<{
  loanId: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  isPaid: boolean;
  isLate: boolean;
}> {
  const installments = [];

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(contractDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      loanId,
      installmentNumber: i,
      dueDate,
      principalAmount: 0, // Interest-only loan
      interestAmount: monthlyPayment,
      totalAmount: monthlyPayment,
      isPaid: false,
      isLate: false,
    });
  }

  return installments;
}

/**
 * Format loan data for application creation
 * Updated: Support multiple title deeds (TitleDeed model)
 */
export function prepareLoanApplicationData(data: any) {
  // Determine deed mode based on titleDeeds array or legacy titleDeedImages
  const deedMode =
    data.deedMode ||
    (data.titleDeeds && data.titleDeeds.length > 1 ? 'MULTIPLE' : 'SINGLE');

  // Calculate total property value from title deeds if available
  let totalPropertyValue = data.totalPropertyValue;
  if (!totalPropertyValue && data.titleDeeds && data.titleDeeds.length > 0) {
    totalPropertyValue = data.titleDeeds.reduce((sum: number, deed: any) => {
      return sum + (deed.propertyValue || 0);
    }, 0);
  }

  return {
    customerData: {
      phoneNumber: data.phoneNumber,
      profile: {
        fullName: data.fullName,
        idCardNumber: data.idCard.replace(/\D/g, ''),
        dateOfBirth: data.birthDate ? new Date(data.birthDate) : null,
        address: data.address,
        email: data.email || null,
      },
    },
    applicationData: {
      loanType: 'HOUSE_LAND_MORTGAGE',
      status: 'SUBMITTED',
      currentStep: 4,
      deedMode: deedMode,
      requestedAmount: data.requestedAmount ?? data.loanAmount,
      approvedAmount: data.loanAmount,
      maxApprovedAmount: data.maxApprovedAmount ?? data.loanAmount * 1.5,
      ownerName: data.ownerName || data.fullName,
      propertyValue: data.propertyValue ?? data.loanAmount * 2,
      totalPropertyValue: totalPropertyValue || null,
      interestRate: data.interestRate,
      termMonths: data.loanYears * 12,
      operationFee: data.operationFee || 0,
      transferFee: data.transferFee || 0,
      otherFee: data.otherFee || 0,
      supportingImages: data.supportingImages || [],
      idCardFrontImage: data.idCardImage || null,
    },
    // Title deeds data for creating TitleDeed records
    titleDeedsData: prepareTitleDeedsData(data),
  };
}

/**
 * Prepare title deeds data from legacy format or new format
 */
function prepareTitleDeedsData(data: any): any[] {
  // If new format (titleDeeds array) is provided, use it
  if (data.titleDeeds && data.titleDeeds.length > 0) {
    return data.titleDeeds.map((deed: any, index: number) => ({
      imageUrl: deed.imageUrl || null,
      imageKey: deed.imageKey || null,
      deedNumber: deed.deedNumber || null,
      provinceName: deed.provinceName || null,
      amphurName: deed.amphurName || null,
      parcelNo: deed.parcelNo || null,
      landAreaText: deed.landAreaText || null,
      ownerName: deed.ownerName || null,
      landType: deed.landType || null,
      titleDeedData: deed.titleDeedData || null,
      latitude: deed.latitude || null,
      longitude: deed.longitude || null,
      linkMap: deed.linkMap || null,
      sortOrder: deed.sortOrder ?? index,
      isPrimary: deed.isPrimary ?? index === 0,
    }));
  }

  // Legacy format: Convert single deed data to array
  const legacyDeed: any = {
    sortOrder: 0,
    isPrimary: true,
  };

  // Image from legacy titleDeedImages
  if (data.titleDeedImages && data.titleDeedImages.length > 0) {
    legacyDeed.imageUrl = data.titleDeedImages[0];
  }

  // Data from legacy titleDeedData
  if (data.titleDeedData) {
    legacyDeed.titleDeedData = data.titleDeedData;

    // Extract data if it's from LandMaps API
    if (data.titleDeedData.result && data.titleDeedData.result.length > 0) {
      const apiData = data.titleDeedData.result[0];
      legacyDeed.deedNumber =
        apiData.parcelno || apiData.landno || data.landNumber || null;
      legacyDeed.provinceName = apiData.provname || null;
      legacyDeed.amphurName = apiData.amphurname || null;
      legacyDeed.parcelNo = apiData.parcelno || null;
      legacyDeed.latitude = apiData.parcellat || null;
      legacyDeed.longitude = apiData.parcellon || null;
      legacyDeed.linkMap = apiData.qrcode_link || null;

      // Land area from API
      if (
        apiData.rai !== undefined &&
        apiData.ngan !== undefined &&
        apiData.wa !== undefined
      ) {
        legacyDeed.landAreaText = `${apiData.rai}-${apiData.ngan}-${apiData.wa}`;
      } else {
        legacyDeed.landAreaText = data.landArea || null;
      }
    } else {
      legacyDeed.deedNumber = data.landNumber || null;
      legacyDeed.landAreaText = data.landArea || null;
    }
  } else {
    legacyDeed.deedNumber = data.landNumber || null;
    legacyDeed.landAreaText = data.landArea || null;
  }

  // Only return if there's meaningful data
  if (
    legacyDeed.imageUrl ||
    legacyDeed.deedNumber ||
    legacyDeed.titleDeedData
  ) {
    return [legacyDeed];
  }

  return [];
}

/**
 * Create or update user and profile
 */
export async function upsertCustomer(
  tx: any,
  phoneNumber: string,
  profileData: {
    fullName: string;
    idCardNumber: string;
    dateOfBirth: Date | null;
    address: string;
    email: string | null;
  },
) {
  // Find or create user
  let customer = await tx.user.findUnique({
    where: { phoneNumber },
    include: { profile: true },
  });

  if (!customer) {
    customer = await tx.user.create({
      data: {
        phoneNumber,
        userType: 'CUSTOMER',
      },
      include: { profile: true },
    });
  }

  // Create or update profile
  if (customer.profile) {
    await tx.userProfile.update({
      where: { userId: customer.id },
      data: profileData,
    });
  } else {
    await tx.userProfile.create({
      data: {
        userId: customer.id,
        ...profileData,
      },
    });
  }

  return customer;
}

/**
 * Update land account balance and create reports
 */
export async function updateLandAccountBalance(
  tx: any,
  landAccountId: string,
  amount: number,
  operation: 'increment' | 'decrement',
  detail: string,
  note: string,
  adminId?: string,
  adminName?: string,
) {
  // Validate account exists and has sufficient balance if decrementing
  const account = await tx.landAccount.findUnique({
    where: { id: landAccountId, deletedAt: null },
  });

  if (!account) {
    throw new Error('ไม่พบบัญชีที่เลือก');
  }

  if (operation === 'decrement' && Number(account.accountBalance) < amount) {
    throw new Error('ยอดเงินในบัญชีไม่เพียงพอ');
  }

  // Update account balance
  const updatedAccount = await tx.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: { [operation]: amount },
      updatedAt: new Date(),
    },
  });

  // Create report
  await tx.landAccountReport.create({
    data: {
      landAccountId,
      detail,
      amount,
      note,
      accountBalance: updatedAccount.accountBalance,
      ...(adminId && { adminId }),
      adminName: adminName || undefined,
    },
  });

  // Create log
  await tx.landAccountLog.create({
    data: {
      landAccountId,
      detail: operation === 'increment' ? 'รับชำระสินเชื่อ' : 'อนุมัติสินเชื่อ',
      amount,
      note,
      ...(adminId && { adminId }),
      adminName: adminName || undefined,
    },
  });

  return updatedAccount;
}

/**
 * Mark installments as paid and update loan
 */
export async function markInstallmentsAsPaid(
  tx: any,
  installmentIds: string[],
  paidDate: Date,
  loanId: string,
) {
  // Mark installments as paid
  await tx.loanInstallment.updateMany({
    where: { id: { in: installmentIds } },
    data: {
      isPaid: true,
      paidDate,
      updatedAt: new Date(),
    },
  });

  // Check if all installments are paid
  const unpaidCount = await tx.loanInstallment.count({
    where: {
      loanId,
      isPaid: false,
    },
  });

  // Get loan details
  const loan = await tx.loan.findUnique({
    where: { id: loanId },
    include: { installments: true },
  });

  if (!loan) {
    throw new Error('ไม่พบข้อมูลสินเชื่อ');
  }

  // Update loan status
  const updateData: any = {
    currentInstallment: loan.currentInstallment + installmentIds.length,
    updatedAt: new Date(),
  };

  if (unpaidCount === 0) {
    updateData.status = 'COMPLETED';
    updateData.remainingBalance = 0;
  } else {
    // Calculate remaining principal
    const paidInstallments = await tx.loanInstallment.findMany({
      where: { loanId, isPaid: true },
    });
    const totalPaidPrincipal = paidInstallments.reduce(
      (sum: number, inst: any) => sum + Number(inst.principalAmount),
      0,
    );
    updateData.remainingBalance = Math.max(
      0,
      Number(loan.principalAmount) - totalPaidPrincipal,
    );
  }

  await tx.loan.update({
    where: { id: loanId },
    data: updateData,
  });

  return unpaidCount === 0;
}

/**
 * Find or create loan application
 */
export async function findOrCreateApplication(
  id: string,
): Promise<{ application: any; loanId: string | null }> {
  // Try to find as application first
  let application = await prisma.loanApplication.findUnique({
    where: { id },
    include: {
      customer: {
        include: { profile: true },
      },
      agent: true,
      loan: true,
    },
  });

  if (application) {
    return {
      application,
      loanId: application.loan?.id || null,
    };
  }

  // Try to find as loan
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          customer: {
            include: { profile: true },
          },
          agent: true,
          loan: true,
        },
      },
    },
  });

  if (!loan || !loan.application) {
    throw new Error('ไม่พบข้อมูลสินเชื่อ');
  }

  return {
    application: loan.application,
    loanId: loan.id,
  };
}

/**
 * Calculate late fee for an installment
 */
export function calculateInstallmentLateFee(
  installment: any,
  includeLateFee: boolean,
  providedLateFee?: number,
): {
  isLate: boolean;
  daysLate: number;
  lateFee: number;
  totalAmount: number;
} {
  const today = new Date();
  const dueDate = new Date(installment.dueDate);
  let totalAmount = Number(installment.totalAmount);
  let lateFee = 0;
  let daysLate = 0;
  let isLate = false;

  if (today > dueDate) {
    isLate = true;
    daysLate = calculateDaysBetween(dueDate, today);
    lateFee = includeLateFee
      ? providedLateFee || calculateLateFee(totalAmount, daysLate)
      : 0;
    totalAmount += lateFee;
  }

  return { isLate, daysLate, lateFee, totalAmount };
}

/**
 * Process land account payment
 */
export async function processLandAccountPayment(
  tx: any,
  landAccountId: string,
  amount: number,
  loanNumber: string,
  installmentNumber: number | null,
  adminId?: string,
  adminName?: string,
) {
  // Validate account exists
  const account = await tx.landAccount.findUnique({
    where: { id: landAccountId, deletedAt: null },
  });

  if (!account) {
    throw new Error('ไม่พบบัญชีที่เลือก');
  }

  // Update account balance
  const updatedAccount = await tx.landAccount.update({
    where: { id: landAccountId },
    data: {
      accountBalance: { increment: amount },
      updatedAt: new Date(),
    },
  });

  // Create detail message
  const detail = installmentNumber
    ? `ชำระสินเชื่อ ${loanNumber}(งวดที่ ${installmentNumber})`
    : `ชำระสินเชื่อ ${loanNumber}(ชำระปิดสินเชื่อ)`;

  const note = installmentNumber
    ? `รับชำระสินเชื่อ ${loanNumber} งวดที่ ${installmentNumber}`
    : `รับชำระปิดสินเชื่อ ${loanNumber}`;

  // Create report
  await tx.landAccountReport.create({
    data: {
      landAccountId,
      detail,
      amount,
      note,
      accountBalance: updatedAccount.accountBalance,
      ...(adminId && { adminId }),
      adminName: adminName || undefined,
    },
  });

  // Create log
  await tx.landAccountLog.create({
    data: {
      landAccountId,
      detail: installmentNumber ? 'รับชำระสินเชื่อ' : 'ปิดสินเชื่อ',
      amount,
      note,
      ...(adminId && { adminId }),
      adminName: adminName || undefined,
    },
  });

  return updatedAccount;
}

// ============================================
// QUERY BUILDERS
// ============================================

/**
 * Build search conditions for loan list query
 * Updated: Search in titleDeeds relation instead of application fields
 */
function buildLoanSearchConditions(
  search: string,
  status?: string,
): Prisma.LoanApplicationWhereInput[] {
  const conditions: Prisma.LoanApplicationWhereInput[] = [
    { customer: { profile: { fullName: { contains: search } } } },
    { ownerName: { contains: search } },
    // Search in titleDeeds
    { titleDeeds: { some: { deedNumber: { contains: search } } } },
    { titleDeeds: { some: { provinceName: { contains: search } } } },
    { titleDeeds: { some: { amphurName: { contains: search } } } },
    { titleDeeds: { some: { parcelNo: { contains: search } } } },
  ];

  // Search by loan number
  const loanSearchCondition: Prisma.LoanWhereInput = {
    loanNumber: { contains: search },
  };
  if (status) loanSearchCondition.status = status;
  conditions.push({ loan: loanSearchCondition });

  // Search by amount if search is numeric
  const searchNumber = parseFloat(search.replace(/,/g, ''));
  if (!isNaN(searchNumber)) {
    conditions.push(
      { requestedAmount: { equals: searchNumber } },
      { approvedAmount: { equals: searchNumber } },
    );

    const amountCondition: Prisma.LoanWhereInput = {
      principalAmount: { equals: searchNumber },
    };
    if (status) amountCondition.status = status;
    conditions.push({ loan: amountCondition });
  }

  return conditions;
}

/**
 * Build where clause for loan list query
 */
function buildLoanListWhere(
  search?: string,
  status?: string,
): Prisma.LoanApplicationWhereInput {
  const where: Prisma.LoanApplicationWhereInput = {
    status: { not: 'DRAFT' },
  };

  if (search) {
    where.OR = buildLoanSearchConditions(search, status);
  } else if (status) {
    where.loan = { status };
  }

  return where;
}

/**
 * Build order by clause for loan list query
 */
function buildLoanListOrderBy(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): Prisma.LoanApplicationOrderByWithRelationInput {
  if (sortBy === 'createdAt') {
    return { createdAt: sortOrder };
  }
  return { [sortBy]: sortOrder, createdAt: 'desc' };
}

/**
 * Transform application with loan to unified format
 * Updated: Include titleDeeds and deedMode
 */
async function transformApplicationWithLoan(app: any) {
  const overdueInstallments = await prisma.loanInstallment.findMany({
    where: {
      loanId: app.loan.id,
      isPaid: false,
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Get primary title deed for backward compatibility
  const primaryDeed =
    app.titleDeeds?.find((d: any) => d.isPrimary) || app.titleDeeds?.[0];

  return {
    ...app.loan,
    application: app,
    customer: app.customer,
    hasOverdueInstallments: overdueInstallments.length > 0,
    overdueCount: overdueInstallments.length,
    oldestOverdueDate: overdueInstallments[0]?.dueDate || null,
    // Include valuation fields from application
    valuationResult: app.valuationResult || null,
    valuationDate: app.valuationDate || null,
    estimatedValue: app.estimatedValue || null,
    // Include title deeds
    titleDeeds: app.titleDeeds || [],
    deedMode: app.deedMode || 'SINGLE',
    // Backward compatibility - get from primary deed if loan doesn't have it
    titleDeedNumber:
      app.loan.titleDeedNumber ||
      primaryDeed?.deedNumber ||
      primaryDeed?.parcelNo ||
      null,
  };
}

/**
 * Transform application without loan to unified format
 * Updated: Get titleDeedNumber from titleDeeds relation
 */
function transformApplicationWithoutLoan(app: any) {
  // Get primary title deed or first title deed
  const primaryDeed =
    app.titleDeeds?.find((d: any) => d.isPrimary) || app.titleDeeds?.[0];
  const titleDeedNumber =
    primaryDeed?.deedNumber || primaryDeed?.parcelNo || null;

  return {
    id: app.id,
    loanNumber: `APP-${app.id.slice(0, 8).toUpperCase()}`,
    customerId: app.customerId,
    customer: app.customer,
    agentId: app.agentId,
    agent: app.agent,
    applicationId: app.id,
    application: app,
    loanType: app.loanType,
    status: app.status as any,
    principalAmount: app.approvedAmount || app.requestedAmount || 0,
    interestRate: 0,
    termMonths: 0,
    monthlyPayment: 0,
    currentInstallment: 0,
    totalInstallments: 0,
    remainingBalance: app.approvedAmount || app.requestedAmount || 0,
    nextPaymentDate: new Date(),
    contractDate: app.createdAt,
    expiryDate: app.createdAt,
    titleDeedNumber: titleDeedNumber,
    collateralValue: app.propertyValue || app.totalPropertyValue,
    collateralDetails: null,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    payments: [],
    installments: [],
    hasOverdueInstallments: false,
    overdueCount: 0,
    oldestOverdueDate: null,
    // Include valuation fields from application
    valuationResult: app.valuationResult || null,
    valuationDate: app.valuationDate || null,
    estimatedValue: app.estimatedValue || null,
    // Include title deeds
    titleDeeds: app.titleDeeds || [],
    deedMode: app.deedMode || 'SINGLE',
  };
}

// ============================================
// UPDATE HELPERS
// ============================================

/**
 * Calculate updated loan values (monthly payment, term, balance)
 */
function calculateUpdatedLoanValues(existing: any, data: LoanUpdateSchema) {
  let monthlyPayment = Number(existing.monthlyPayment || 0);
  let termMonths = existing.termMonths || 48;
  let remainingBalance = Number(existing.remainingBalance || 0);

  if (data.loanAmount || data.loanYears || data.interestRate) {
    const loanAmount = data.loanAmount ?? Number(existing.principalAmount || 0);
    const loanYears =
      data.loanYears ?? (existing.termMonths ? existing.termMonths / 12 : 4);
    const interestRate =
      data.interestRate ?? Number(existing.interestRate || 1);

    termMonths = loanYears * 12;
    monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate);
    remainingBalance = loanAmount * (1 + interestRate / 100);
  }

  return { monthlyPayment, termMonths, remainingBalance };
}

/**
 * Update loan record
 */
async function updateLoanRecord(
  tx: any,
  id: string,
  data: LoanUpdateSchema,
  calculatedValues: {
    monthlyPayment: number;
    termMonths: number;
    remainingBalance: number;
  },
) {
  const { monthlyPayment, termMonths, remainingBalance } = calculatedValues;

  const updateData: Prisma.LoanUpdateInput = {
    ...(data.loanAmount && { principalAmount: data.loanAmount }),
    ...(data.interestRate && { interestRate: data.interestRate }),
    ...(data.loanYears && { termMonths, totalInstallments: termMonths }),
    monthlyPayment,
    remainingBalance,
    ...(data.loanStartDate && { contractDate: new Date(data.loanStartDate) }),
    ...(data.loanDueDate && { expiryDate: new Date(data.loanDueDate) }),
    ...(data.landNumber && { titleDeedNumber: data.landNumber }),
    updatedAt: new Date(),
  };

  return tx.loan.update({
    where: { id },
    data: updateData,
    include: { customer: { include: { profile: true } }, application: true },
  });
}

/**
 * Update customer profile
 */
async function updateCustomerProfile(
  tx: any,
  customerId: string,
  data: LoanUpdateSchema,
) {
  const hasProfileChanges =
    data.fullName ||
    data.email ||
    data.address ||
    data.birthDate ||
    data.idCardImage ||
    data.idCard;
  if (!hasProfileChanges) return;

  const profileData: any = {};
  if (data.fullName) profileData.fullName = data.fullName;
  if (data.email) profileData.email = data.email;
  if (data.address) profileData.address = data.address;
  if (data.birthDate) profileData.dateOfBirth = new Date(data.birthDate);
  if (data.idCard) profileData.idCardNumber = data.idCard.replace(/\D/g, '');
  if (data.idCardImage) profileData.idCardFrontImage = data.idCardImage;

  await tx.userProfile.update({
    where: { userId: customerId },
    data: profileData,
  });
}

/**
 * Update customer phone number
 */
async function updateCustomerPhoneNumber(
  tx: any,
  customerId: string,
  newPhoneNumber: string,
) {
  const currentCustomer = await tx.user.findUnique({
    where: { id: customerId },
  });
  if (currentCustomer && newPhoneNumber !== currentCustomer.phoneNumber) {
    await tx.user.update({
      where: { id: customerId },
      data: { phoneNumber: newPhoneNumber },
    });
  }
}

/**
 * Update loan application data
 * Updated: Remove old fields, add titleDeeds management
 */
async function updateLoanApplicationData(
  tx: any,
  applicationId: string,
  data: LoanUpdateSchema,
) {
  const hasApplicationChanges =
    data.ownerName ||
    data.propertyValue !== undefined ||
    data.totalPropertyValue !== undefined ||
    data.requestedAmount !== undefined ||
    data.maxApprovedAmount !== undefined ||
    data.loanAmount ||
    data.supportingImages ||
    data.idCardImage ||
    data.deedMode ||
    data.titleDeeds;

  if (!hasApplicationChanges) return;

  const updateData: any = {
    ...(data.ownerName && { ownerName: data.ownerName }),
    ...(data.propertyValue !== undefined && {
      propertyValue: data.propertyValue,
    }),
    ...(data.totalPropertyValue !== undefined && {
      totalPropertyValue: data.totalPropertyValue,
    }),
    ...(data.requestedAmount !== undefined && {
      requestedAmount: data.requestedAmount,
    }),
    ...(data.maxApprovedAmount !== undefined && {
      maxApprovedAmount: data.maxApprovedAmount,
    }),
    ...(data.loanAmount && { approvedAmount: data.loanAmount }),
    ...(data.supportingImages !== undefined && {
      supportingImages: data.supportingImages,
    }),
    ...(data.idCardImage && { idCardFrontImage: data.idCardImage }),
    ...(data.deedMode && { deedMode: data.deedMode }),
  };

  await tx.loanApplication.update({
    where: { id: applicationId },
    data: updateData,
  });

  // Update title deeds if provided
  if (data.titleDeeds && data.titleDeeds.length > 0) {
    await updateTitleDeeds(tx, applicationId, data.titleDeeds);
  } else if (data.titleDeedImages && data.titleDeedImages.length > 0) {
    // Legacy format: Update using old format
    await updateTitleDeedsFromLegacy(tx, applicationId, data);
  }
}

/**
 * Update title deeds for an application
 */
async function updateTitleDeeds(
  tx: any,
  applicationId: string,
  titleDeeds: any[],
) {
  // Get existing title deeds
  const existingDeeds = await tx.titleDeed.findMany({
    where: { applicationId },
  });

  const existingIds = existingDeeds.map((d: any) => d.id);
  const updatedIds: string[] = [];

  for (let i = 0; i < titleDeeds.length; i++) {
    const deed = titleDeeds[i];

    if (deed.id && existingIds.includes(deed.id)) {
      // Update existing deed
      await tx.titleDeed.update({
        where: { id: deed.id },
        data: {
          imageUrl: deed.imageUrl,
          imageKey: deed.imageKey,
          deedNumber: deed.deedNumber,
          provinceName: deed.provinceName,
          amphurName: deed.amphurName,
          parcelNo: deed.parcelNo,
          landAreaText: deed.landAreaText,
          ownerName: deed.ownerName,
          landType: deed.landType,
          titleDeedData: deed.titleDeedData,
          latitude: deed.latitude,
          longitude: deed.longitude,
          linkMap: deed.linkMap,
          sortOrder: deed.sortOrder ?? i,
          isPrimary: deed.isPrimary ?? i === 0,
        },
      });
      updatedIds.push(deed.id);
    } else {
      // Create new deed
      const newDeed = await tx.titleDeed.create({
        data: {
          applicationId,
          imageUrl: deed.imageUrl,
          imageKey: deed.imageKey,
          deedNumber: deed.deedNumber,
          provinceName: deed.provinceName,
          amphurName: deed.amphurName,
          parcelNo: deed.parcelNo,
          landAreaText: deed.landAreaText,
          ownerName: deed.ownerName,
          landType: deed.landType,
          titleDeedData: deed.titleDeedData,
          latitude: deed.latitude,
          longitude: deed.longitude,
          linkMap: deed.linkMap,
          sortOrder: deed.sortOrder ?? i,
          isPrimary: deed.isPrimary ?? i === 0,
        },
      });
      updatedIds.push(newDeed.id);
    }
  }

  // Delete removed deeds
  const idsToDelete = existingIds.filter(
    (id: string) => !updatedIds.includes(id),
  );
  if (idsToDelete.length > 0) {
    await tx.titleDeed.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }
}

/**
 * Update title deeds from legacy format (titleDeedImages)
 */
async function updateTitleDeedsFromLegacy(
  tx: any,
  applicationId: string,
  data: any,
) {
  // Get existing title deeds
  const existingDeeds = await tx.titleDeed.findMany({
    where: { applicationId },
  });

  if (existingDeeds.length > 0) {
    // Update first deed with new image
    await tx.titleDeed.update({
      where: { id: existingDeeds[0].id },
      data: {
        imageUrl: data.titleDeedImages[0],
        ...(data.titleDeedData && { titleDeedData: data.titleDeedData }),
        ...(data.landNumber && { deedNumber: data.landNumber }),
        ...(data.landArea && { landAreaText: data.landArea }),
      },
    });
  } else {
    // Create new deed
    await tx.titleDeed.create({
      data: {
        applicationId,
        imageUrl: data.titleDeedImages[0],
        titleDeedData: data.titleDeedData || null,
        deedNumber: data.landNumber || null,
        landAreaText: data.landArea || null,
        sortOrder: 0,
        isPrimary: true,
      },
    });
  }
}

// ============================================
// LOAN SERVICE
// ============================================

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

    const where = buildLoanListWhere(search, status);
    const orderBy = buildLoanListOrderBy(sortBy, sortOrder);
    const skip = (page - 1) * limit;

    // Query applications with pagination - include titleDeeds
    const [applications, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: { include: { profile: true } },
          agent: true,
          titleDeeds: { orderBy: { sortOrder: 'asc' } },
          loan: {
            include: {
              installments: { orderBy: { installmentNumber: 'asc' }, take: 1 },
            },
          },
        },
      }),
      prisma.loanApplication.count({ where }),
    ]);

    // Transform to unified format
    const transformedData = await Promise.all(
      applications.map((app) =>
        app.loan
          ? transformApplicationWithLoan(app)
          : transformApplicationWithoutLoan(app),
      ),
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
      application: {
        include: {
          titleDeeds: { orderBy: { sortOrder: 'asc' } },
        },
      },
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
      // Get primary title deed for backward compatibility
      const primaryDeed =
        loan.application?.titleDeeds?.find((d: any) => d.isPrimary) ||
        loan.application?.titleDeeds?.[0];

      // Include valuation fields and title deeds from application
      return {
        ...loan,
        valuationResult: loan.application?.valuationResult || null,
        valuationDate: loan.application?.valuationDate || null,
        estimatedValue: loan.application?.estimatedValue || null,
        titleDeeds: loan.application?.titleDeeds || [],
        deedMode: loan.application?.deedMode || 'SINGLE',
        // Backward compatibility - get from primary deed if loan doesn't have it
        titleDeedNumber:
          loan.titleDeedNumber ||
          primaryDeed?.deedNumber ||
          primaryDeed?.parcelNo ||
          null,
      };
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
        agent: true,
        titleDeeds: { orderBy: { sortOrder: 'asc' } },
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

    // Get primary title deed
    const primaryDeed =
      application.titleDeeds?.find((d: any) => d.isPrimary) ||
      application.titleDeeds?.[0];
    const titleDeedNumber =
      primaryDeed?.deedNumber || primaryDeed?.parcelNo || null;

    // ถ้ามี loan ใน application ให้ return loan with valuation fields
    if (application.loan) {
      return {
        ...application.loan,
        application,
        customer: application.customer,
        // Include valuation fields from application
        valuationResult: application.valuationResult || null,
        valuationDate: application.valuationDate || null,
        estimatedValue: application.estimatedValue || null,
        titleDeeds: application.titleDeeds || [],
        deedMode: application.deedMode || 'SINGLE',
        titleDeedNumber: application.loan.titleDeedNumber || titleDeedNumber,
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
      titleDeedNumber: titleDeedNumber,
      collateralValue:
        application.propertyValue || application.totalPropertyValue,
      collateralDetails: null,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      payments: [],
      installments: [],
      // Include valuation fields from application
      valuationResult: application.valuationResult || null,
      valuationDate: application.valuationDate || null,
      estimatedValue: application.estimatedValue || null,
      // Include title deeds
      titleDeeds: application.titleDeeds || [],
      deedMode: application.deedMode || 'SINGLE',
    };
  },

  async create(data: LoanCreateSchema, adminId?: string, adminName?: string) {
    // คำนวณข้อมูลสินเชื่อ
    const { loanAmount, loanYears, interestRate } = data;
    const termMonths = loanYears * 12;
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate);
    const contractDate = new Date(data.loanStartDate);

    // Prepare application data (now includes titleDeedsData)
    const { customerData, applicationData, titleDeedsData } =
      prepareLoanApplicationData({
        ...data,
        loanAmount,
        loanYears,
        interestRate,
      });

    // Use transaction to ensure data consistency
    const application = await prisma.$transaction(async (tx) => {
      // Step 1: Create or update customer
      const customer = await upsertCustomer(
        tx,
        customerData.phoneNumber,
        customerData.profile,
      );

      // Step 2: Create loan application
      const app = await tx.loanApplication.create({
        data: {
          ...applicationData,
          customerId: customer.id,
        },
      });

      // Step 3: Create title deeds
      if (titleDeedsData && titleDeedsData.length > 0) {
        await tx.titleDeed.createMany({
          data: titleDeedsData.map((deed: any) => ({
            ...deed,
            applicationId: app.id,
          })),
        });
      }

      // Return with relations
      return tx.loanApplication.findUnique({
        where: { id: app.id },
        include: {
          customer: {
            include: {
              profile: true,
            },
          },
          titleDeeds: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return application;
  },

  async update(id: string, data: LoanUpdateSchema) {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    const hasLoanRecord = await prisma.loan.findUnique({ where: { id } });
    const isApplicationOnly = !hasLoanRecord;

    // Calculate updated loan values
    const calculatedValues = calculateUpdatedLoanValues(existing, data);

    return prisma.$transaction(async (tx) => {
      let updatedLoan = null;

      // Step 1: Update Loan record (if exists)
      if (!isApplicationOnly) {
        updatedLoan = await updateLoanRecord(tx, id, data, calculatedValues);
      }

      // Step 2: Update customer profile
      if (existing.customerId) {
        await updateCustomerProfile(tx, existing.customerId, data);
      }

      // Step 3: Update phone number
      if (existing.customerId && data.phoneNumber) {
        await updateCustomerPhoneNumber(
          tx,
          existing.customerId,
          data.phoneNumber,
        );
      }

      // Step 4: Update loan application
      if (existing.applicationId) {
        await updateLoanApplicationData(tx, existing.applicationId, data);
      }

      // Return updated data
      if (updatedLoan) return updatedLoan;

      return tx.loanApplication.findUnique({
        where: { id: existing.applicationId },
        include: { customer: { include: { profile: true } }, loan: true },
      });
    });
  },

  async approve(
    id: string,
    landAccountId: string,
    adminId?: string,
    adminName?: string,
  ) {
    // Find application
    const { application } = await findOrCreateApplication(id);

    // Validate application status
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new Error('สินเชื่อนี้ไม่สามารถอนุมัติได้');
    }

    return prisma.$transaction(async (tx) => {
      // Update application status
      await tx.loanApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          approvedAmount: application.requestedAmount,
        },
      });

      // Check if loan already exists
      const existingLoan = await tx.loan.findUnique({
        where: { applicationId: application.id },
      });

      if (existingLoan) {
        // Update existing loan status
        await tx.loan.update({
          where: { id: existingLoan.id },
          data: { status: 'ACTIVE', updatedAt: new Date() },
        });
      } else {
        // Create new loan
        await this._createNewLoanFromApplication(
          tx,
          application,
          landAccountId,
          adminId,
          adminName,
        );
      }

      return { success: true };
    });
  },

  /**
   * Internal: Create new loan from application
   * Updated: Get titleDeedNumber from TitleDeed relation
   */
  async _createNewLoanFromApplication(
    tx: any,
    application: any,
    landAccountId: string,
    adminId?: string,
    adminName?: string,
  ) {
    const loanNumber = generateLoanNumber();
    const loanAmount = Number(application.requestedAmount || 0);
    const interestRate = Number(application.interestRate || 1);
    const termMonths = application.termMonths || 48;
    const loanYears = termMonths / 12;
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate);

    const contractDate = new Date();
    const expiryDate = calculateExpiryDate(contractDate, loanYears);
    const nextPaymentDate = calculateNextPaymentDate(contractDate);

    // Get title deed number from TitleDeed relation
    const titleDeeds = await tx.titleDeed.findMany({
      where: { applicationId: application.id },
      orderBy: { sortOrder: 'asc' },
    });
    const primaryDeed =
      titleDeeds.find((d: any) => d.isPrimary) || titleDeeds[0];
    const titleDeedNumber =
      primaryDeed?.deedNumber || primaryDeed?.parcelNo || null;

    // Get location data from primary deed
    const latitude = primaryDeed?.latitude || null;
    const longitude = primaryDeed?.longitude || null;
    const linkMap = primaryDeed?.linkMap || null;

    // Create loan
    const newLoan = await tx.loan.create({
      data: {
        loanNumber,
        loanType: application.loanType,
        status: 'ACTIVE',
        principalAmount: loanAmount,
        interestRate,
        termMonths,
        monthlyPayment,
        currentInstallment: 0,
        totalInstallments: termMonths,
        remainingBalance: loanAmount * (1 + interestRate / 100),
        nextPaymentDate,
        contractDate,
        expiryDate,
        titleDeedNumber: titleDeedNumber,
        customerId: application.customerId,
        applicationId: application.id,
        agentId: application.agentId,
        latitude: latitude,
        longitude: longitude,
        linkMap: linkMap,
      },
    });

    // Create installments
    const installmentsData = generateInstallmentsData(
      newLoan.id,
      contractDate,
      termMonths,
      monthlyPayment,
    );
    await tx.loanInstallment.createMany({ data: installmentsData });

    // Deduct from land account
    if (landAccountId) {
      const customerName = application.customer?.profile?.fullName || '';

      await updateLandAccountBalance(
        tx,
        landAccountId,
        loanAmount,
        'decrement',
        `เปิดสินเชื่อ(${loanNumber})`,
        '',
        adminId,
        adminName,
      );
    }

    return newLoan;
  },

  async reject(id: string, reviewNotes: string) {
    // Find application
    const { application, loanId } = await findOrCreateApplication(id);

    // Validate application status
    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
      throw new Error('สินเชื่อนี้ไม่สามารถยกเลิกได้');
    }

    return prisma.$transaction(async (tx) => {
      // Update application status
      await tx.loanApplication.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewNotes,
        },
      });

      // Cancel loan if exists
      if (loanId) {
        await tx.loan.update({
          where: { id: loanId },
          data: {
            status: 'CANCELLED',
            updatedAt: new Date(),
          },
        });
      }

      return { success: true };
    });
  },

  /**
   * Get property valuation for a loan application
   * Updated: Read title deed data from TitleDeed model
   */
  async getValuation(applicationId: string) {
    console.log(
      '[LoanService] Starting valuation for application:',
      applicationId,
    );

    // Try to find as application first with titleDeeds
    let application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        titleDeeds: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // If not found, try to find by loan ID
    if (!application) {
      const loan = await prisma.loan.findUnique({
        where: { id: applicationId },
        include: {
          application: {
            include: {
              titleDeeds: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });
      if (loan?.application) {
        application = loan.application;
      }
    }

    if (!application) {
      throw new Error('ไม่พบข้อมูลใบสมัครสินเชื่อ');
    }

    // Get primary title deed image from TitleDeed model
    const primaryDeed =
      application.titleDeeds?.find((d: any) => d.isPrimary) ||
      application.titleDeeds?.[0];
    const titleDeedImage = primaryDeed?.imageUrl;

    // Get supporting images from application
    const supportingImages = application.supportingImages
      ? typeof application.supportingImages === 'string'
        ? JSON.parse(application.supportingImages)
        : application.supportingImages
      : [];

    console.log('[LoanService] Image data:', {
      hasTitleDeedImage: !!titleDeedImage,
      titleDeedsCount: application.titleDeeds?.length || 0,
      supportingImagesCount: Array.isArray(supportingImages)
        ? supportingImages.length
        : 0,
    });

    if (!titleDeedImage) {
      throw new Error('ไม่พบรูปโฉนดที่ดิน');
    }

    if (!Array.isArray(supportingImages) || supportingImages.length === 0) {
      throw new Error('ต้องมีรูปเพิ่มเติมอย่างน้อย 1 รูป');
    }

    console.log('[LoanService] Converting images to buffers...');

    // Helper function to convert URL to Buffer
    const urlToBuffer = async (url: string): Promise<Buffer> => {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    };

    // Convert title deed image to Buffer
    const titleDeedBuffer = await urlToBuffer(titleDeedImage);

    // Convert supporting images to Buffers
    const supportingBuffers: Buffer[] = [];
    for (let i = 0; i < supportingImages.length; i++) {
      const buffer = await urlToBuffer(supportingImages[i]);
      supportingBuffers.push(buffer);
    }

    console.log('[LoanService] Calling aiService.evaluatePropertyValue...');

    // Get title deed data from primary deed
    const titleDeedData = primaryDeed?.titleDeedData
      ? typeof primaryDeed.titleDeedData === 'string'
        ? JSON.parse(primaryDeed.titleDeedData)
        : primaryDeed.titleDeedData
      : null;

    // Call AI service to evaluate property value
    const result = await aiService.evaluatePropertyValue(
      titleDeedBuffer,
      titleDeedData,
      supportingBuffers,
    );

    console.log('[LoanService] Valuation result:', result);

    return {
      success: true,
      ...result,
    };
  },

  /**
   * Save valuation result for a loan application
   */
  async saveValuation(
    applicationId: string,
    valuationResult: string,
    estimatedValue: number,
  ) {
    if (!valuationResult || !estimatedValue) {
      throw new Error('กรุณาระบุผลการประเมินและมูลค่าประเมิน');
    }

    // Try to find as application first
    let application = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
    });

    // If not found, try to find by loan ID
    if (!application) {
      const loan = await prisma.loan.findUnique({
        where: { id: applicationId },
        include: { application: true },
      });
      if (loan?.application) {
        application = loan.application;
      }
    }

    if (!application) {
      throw new Error('ไม่พบข้อมูลใบสมัครสินเชื่อ');
    }

    // Update loan application with valuation data
    const updatedApplication = await prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        valuationResult,
        valuationDate: new Date(),
        estimatedValue: parseFloat(estimatedValue.toString()),
      },
      include: {
        customer: {
          include: {
            profile: true,
          },
        },
        loan: true,
      },
    });

    return updatedApplication;
  },

  async delete(id: string) {
    // Find application
    const { application, loanId } = await findOrCreateApplication(id);

    // Hard delete - remove from database
    return prisma.$transaction(async (tx) => {
      // Delete loan-related data if loan exists
      if (loanId) {
        await tx.loanInstallment.deleteMany({ where: { loanId } });
        await tx.payment.deleteMany({ where: { loanId } });
        await tx.loan.delete({ where: { id: loanId } });
      }

      // Delete application
      await tx.loanApplication.delete({ where: { id: application.id } });

      return { success: true };
    });
  },

  async generateInstallments(id: string) {
    // Validate loan exists
    const loan = await this.getById(id);
    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // Check if installments already exist
    const existingCount = await prisma.loanInstallment.count({
      where: { loanId: id },
    });

    if (existingCount > 0) {
      throw new Error('สินเชื่อนี้มีตารางผ่อนชำระอยู่แล้ว');
    }

    // Generate installments
    const installmentsData = generateInstallmentsData(
      id,
      new Date(loan.contractDate),
      loan.termMonths,
      Number(loan.monthlyPayment),
    );

    await prisma.loanInstallment.createMany({ data: installmentsData });

    // Return updated loan with installments
    return this.getById(id);
  },

  /**
   * Analyze title deed image
   */
  async analyzeTitleDeed(file: File) {
    console.log('[LoanService] Starting title deed analysis');

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Upload to storage
    let uploadResult;
    try {
      uploadResult = await storage.uploadFile(buffer, file.type, {
        folder: 'title-deeds',
        filename: `title_deed_${Date.now()}_${file.name}`,
      });
    } catch (uploadError) {
      console.error('[LoanService] Storage upload failed:', uploadError);
      uploadResult = {
        url: `data:${file.type};base64,${buffer.toString('base64')}`,
        key: `temp_${Date.now()}_${file.name}`,
      };
    }

    // Step 2: Analyze with AI
    let analysisResult;
    try {
      analysisResult = await aiService.analyzeTitleDeedImage(buffer, file.type);
    } catch (aiError) {
      console.error('[LoanService] AI analysis failed:', aiError);
      analysisResult = {
        pvName: '',
        amName: '',
        parcelNo: '',
      };
    }

    // Step 3: Process analysis result
    return this.processTitleDeedAnalysis(analysisResult, uploadResult);
  },

  /**
   * Manual title deed lookup
   */
  async manualTitleDeedLookup(data: ManualLookupSchema) {
    console.log('[LoanService] Manual title deed lookup');

    const apiKey = process.env.ZENROWS_API_KEY;
    const landsMapsAPI = new LandsMapsAPI(apiKey);

    const titleDeedData = await landsMapsAPI.getParcelInfoComplete(
      parseInt(data.pvCode),
      data.amCode,
      parseInt(data.parcelNo),
    );

    return {
      success: true,
      titleDeedData,
    };
  },

  /**
   * Process title deed analysis result
   */
  async processTitleDeedAnalysis(analysisResult: any, uploadResult: any) {
    const finalResult = {
      imageUrl: uploadResult.url,
      imageKey: uploadResult.key,
      analysisResult,
      titleDeedData: null as any,
      needsManualInput: false,
      manualInputType: '' as 'full' | 'amphur_only' | '',
      errorMessage: undefined as string | undefined,
    };

    // Process based on AI analysis result
    if (!analysisResult.pvName) {
      finalResult.needsManualInput = true;
      finalResult.manualInputType = 'full';
    } else {
      try {
        const provinceSearchResult = await aiService.findProvinceCode(
          analysisResult.pvName,
          provinceData,
        );

        if (!provinceSearchResult.pvCode) {
          finalResult.needsManualInput = true;
          finalResult.manualInputType = 'full';
        } else {
          try {
            const amphurSearchResult = await aiService.findAmphurCode(
              analysisResult.amName,
              provinceSearchResult.pvCode,
              amphurData,
              analysisResult.parcelNo,
            );

            if (!amphurSearchResult.amCode) {
              finalResult.needsManualInput = true;
              finalResult.manualInputType = 'amphur_only';
              finalResult.analysisResult = {
                ...finalResult.analysisResult,
                pvCode: provinceSearchResult.pvCode,
              };
            } else {
              // Successfully found all codes, show modal for user confirmation
              finalResult.needsManualInput = true;
              finalResult.manualInputType = 'full';
              finalResult.analysisResult = {
                ...finalResult.analysisResult,
                pvCode: amphurSearchResult.pvCode,
                amCode: amphurSearchResult.amCode,
                parcelNo: amphurSearchResult.parcelNo,
              };
              finalResult.errorMessage =
                'กรุณาตรวจสอบความถูกต้องของข้อมูลที่ระบบวิเคราะห์ได้';
            }
          } catch (amphurError) {
            finalResult.needsManualInput = true;
            finalResult.manualInputType = 'amphur_only';
            finalResult.analysisResult = {
              ...finalResult.analysisResult,
              pvCode: provinceSearchResult.pvCode,
            };
          }
        }
      } catch (provinceError) {
        finalResult.needsManualInput = true;
        finalResult.manualInputType = 'full';
      }
    }

    return finalResult;
  },

  /**
   * Generate Loan Contract PDF
   */
  async generateContractPDF(loanId: string): Promise<Buffer> {
    const { renderPDFToBuffer } = await import('@src/shared/lib/pdf/generator');
    const { LoanContractPDF } = await import('@src/shared/lib/pdf/templates');
    const { registerFonts } = await import('@src/shared/lib/pdf/fonts');
    const { calculateAge } = await import('@src/shared/lib/pdf/thai-date');
    const React = await import('react');

    // Register fonts
    registerFonts();

    // Fetch loan data
    const loan = await loanRepository.findById(loanId, {
      customer: {
        include: {
          profile: true,
        },
      },
      application: true,
    });

    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // Prepare data for PDF
    const pdfData = {
      loan_customer: loan.customer?.profile?.fullName || '',
      loan_date_promise: loan.contractDate.toISOString(),
      loan_summary_no_vat: Number(loan.principalAmount),
      loan_payment_interest: Number(loan.interestRate),
      loan_installment_date: loan.nextPaymentDate.toISOString(),
      loan_payment_year_counter: Math.floor(loan.termMonths / 12),
      customer_age: loan.customer?.profile?.dateOfBirth
        ? calculateAge(loan.customer.profile.dateOfBirth)
        : undefined,
      customer_address: loan.customer?.profile?.address || '',
      lender_name: 'บริษัท อินฟินิเท็กซ์ จำกัด',
      note: '',
    };

    // Generate PDF
    return renderPDFToBuffer(
      React.createElement(LoanContractPDF, { data: pdfData }),
    );
  },

  /**
   * Generate Installment Schedule PDF
   */
  async generateInstallmentPDF(loanId: string): Promise<Buffer> {
    const { renderPDFToBuffer } = await import('@src/shared/lib/pdf/generator');
    const { InstallmentSchedulePDF } = await import(
      '@src/shared/lib/pdf/templates'
    );
    const { registerFonts } = await import('@src/shared/lib/pdf/fonts');
    const { format } = await import('date-fns');
    const React = await import('react');

    // Register fonts
    registerFonts();

    // Fetch loan data
    const loan = await loanRepository.findById(loanId, {
      customer: {
        include: {
          profile: true,
        },
      },
      agent: {
        include: {
          profile: true,
        },
      },
      installments: {
        orderBy: {
          installmentNumber: 'asc',
        },
      },
    });

    if (!loan) {
      throw new Error('ไม่พบข้อมูลสินเชื่อ');
    }

    // Prepare loan data
    const loanData = {
      loan_customer: loan.customer?.profile?.fullName || '',
      loan_employee: loan.agent?.profile?.fullName || '',
      loan_date_promise: loan.contractDate.toISOString(),
      loan_summary_no_vat: Number(loan.principalAmount),
      loan_payment_interest: Number(loan.interestRate),
      loan_payment_year_counter: Math.floor(loan.termMonths / 12),
      loan_payment_month: Number(loan.monthlyPayment),
      loan_installment_date: loan.nextPaymentDate.toISOString(),
      customer_address: loan.customer?.profile?.address || '',
      customer_phone: loan.customer?.phoneNumber || '',
      branch: 'สำนักงานใหญ่',
    };

    // Prepare installments data
    let remainingBalance = Number(loan.principalAmount);
    const installmentsData = loan.installments.map((installment) => {
      const principalPaid = Number(installment.principalAmount);
      remainingBalance -= principalPaid;

      return {
        loan_payment_installment: installment.installmentNumber,
        loan_payment_date: format(installment.dueDate, 'dd/MM/yyyy'),
        loan_payment_customer: loan.customer?.profile?.fullName || '',
        loan_employee: loan.agent?.profile?.fullName || '',
        loan_payment_amount: Number(installment.totalAmount),
        loan_balance: Math.max(0, remainingBalance),
      };
    });

    // Generate PDF
    return renderPDFToBuffer(
      React.createElement(InstallmentSchedulePDF, {
        loan: loanData,
        installments: installmentsData,
      }),
    );
  },
};

// ============================================
// PAYMENT SERVICE
// ============================================

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
                fullName: true,
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
  async payInstallment(
    data: PayInstallmentSchema,
    userId?: string,
    adminId?: string,
    adminName?: string,
  ) {
    // Validate loan
    const loan = await loanRepository.findById(data.loanId, {
      installments: true,
    });

    if (!loan || loan.status !== 'ACTIVE') {
      throw new Error(
        !loan
          ? 'ไม่พบข้อมูลสินเชื่อ'
          : 'สินเชื่อไม่อยู่ในสถานะที่สามารถชำระได้',
      );
    }

    const payerUserId = userId || loan.customerId;
    if (!payerUserId) {
      throw new Error('ไม่พบข้อมูลผู้ชำระเงิน');
    }

    // Validate installment
    const installment = await this._validateInstallment(
      data.installmentId,
      data.loanId,
    );

    // Calculate late fee
    const { isLate, daysLate, lateFee } = calculateInstallmentLateFee(
      installment,
      data.includeLateFee || false,
      data.lateFeeAmount,
    );

    // Update late fee if applicable
    if (isLate && lateFee > 0) {
      await installmentRepository.updateLateFee(
        installment.id,
        lateFee,
        daysLate,
      );
    }

    // Base installment amount (without late fee)
    const baseAmount = Number(installment.totalAmount);

    // Validate payment amount - only require base installment amount
    if (data.amount < baseAmount) {
      throw new Error(
        `จำนวนเงินไม่เพียงพอ ต้องชำระอย่างน้อย ${baseAmount.toLocaleString()} บาท`,
      );
    }

    const paidDate = new Date();

    // Create payment record
    const payment = await paymentRepository.create({
      user: { connect: { id: payerUserId } },
      loan: { connect: { id: data.loanId } },
      installment: { connect: { id: data.installmentId } },
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      status: 'COMPLETED',
      referenceNumber: generateReferenceNumber(),
      dueDate: installment.dueDate,
      paidDate,
      principalAmount: Number(installment.principalAmount),
      interestAmount: Number(installment.interestAmount),
      feeAmount: lateFee,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      transactionId: data.transactionId,
    });

    // Mark installment as paid and update loan
    await markInstallmentsAsPaid(
      prisma,
      [data.installmentId],
      paidDate,
      data.loanId,
    );

    // Process land account payment
    if (data.landAccountId) {
      await prisma.$transaction(async (tx) => {
        await processLandAccountPayment(
          tx,
          data.landAccountId!,
          data.amount,
          loan.loanNumber,
          installment.installmentNumber,
          adminId,
          adminName,
        );
      });
    }

    return {
      payment,
      message: 'ชำระเงินสำเร็จ',
      totalAmount: baseAmount,
      lateFee,
      daysLate,
      isLate,
    };
  },

  /**
   * Internal: Validate installment for payment
   */
  async _validateInstallment(installmentId: string, loanId: string) {
    const installment = await installmentRepository.findById(installmentId, {
      payments: true,
    });

    if (!installment) {
      throw new Error('ไม่พบข้อมูลงวดชำระ');
    }

    if (installment.isPaid) {
      throw new Error('งวดนี้ชำระแล้ว');
    }

    if (installment.loanId !== loanId) {
      throw new Error('งวดชำระไม่ตรงกับสินเชื่อที่ระบุ');
    }

    return installment;
  },

  /**
   * Close/Payoff the entire loan
   */
  async closeLoan(
    data: CloseLoanSchema,
    userId?: string,
    adminId?: string,
    adminName?: string,
  ) {
    // Validate loan
    const loan = await loanRepository.findById(data.loanId, {
      installments: true,
    });

    if (!loan || loan.status !== 'ACTIVE') {
      throw new Error(
        !loan ? 'ไม่พบข้อมูลสินเชื่อ' : 'สินเชื่อไม่อยู่ในสถานะที่สามารถปิดได้',
      );
    }

    const payerUserId = userId || loan.customerId;
    if (!payerUserId) {
      throw new Error('ไม่พบข้อมูลผู้ชำระเงิน');
    }

    // Get unpaid installments
    const unpaidInstallments = await installmentRepository.findUnpaidByLoanId(
      data.loanId,
    );

    if (unpaidInstallments.length === 0) {
      throw new Error('สินเชื่อนี้ชำระครบแล้ว');
    }

    // Calculate payoff amount - use loan's principal amount (วงเงินสินเชื่อ)
    const loanPrincipal = Number(loan.principalAmount || 0);
    const discount = data.discountAmount || 0;
    const additionalFees = data.additionalFees || 0;

    // Use custom amount if provided, otherwise use loan's principal amount
    const baseAmount =
      data.customAmount !== undefined ? data.customAmount : loanPrincipal;
    const totalPayoffAmount = baseAmount - discount + additionalFees;

    const paidDate = new Date();

    // Create payment record - only principal amount, no interest
    const payment = await paymentRepository.create({
      user: { connect: { id: payerUserId } },
      loan: { connect: { id: data.loanId } },
      amount: totalPayoffAmount,
      paymentMethod: data.paymentMethod,
      status: 'COMPLETED',
      referenceNumber: generateReferenceNumber(),
      dueDate: paidDate,
      paidDate,
      principalAmount: baseAmount, // Use custom amount or calculated principal
      interestAmount: 0, // ปิดสินเชื่อไม่คิดดอกเบี้ย
      feeAmount: additionalFees,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
      transactionId: data.transactionId,
    });

    // Mark all installments as paid and complete loan
    await markInstallmentsAsPaid(
      prisma,
      unpaidInstallments.map((i) => i.id),
      paidDate,
      data.loanId,
    );

    // Process land account payment
    if (data.landAccountId) {
      await prisma.$transaction(async (tx) => {
        await processLandAccountPayment(
          tx,
          data.landAccountId!,
          totalPayoffAmount,
          loan.loanNumber,
          null, // null = close loan (not specific installment)
          adminId,
          adminName,
        );
      });
    }

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
