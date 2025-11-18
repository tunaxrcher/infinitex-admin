'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchCustomers } from '@src/features/customers/hooks';
import {
  useCreateLoan,
  useGetLoanById,
  useUpdateLoan,
} from '@src/features/loans/hooks';
import { useGetLandAccountList } from '@src/features/land-accounts/hooks';
import { cn } from '@src/shared/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@src/shared/components/ui/command';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@src/shared/components/ui/popover';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@src/shared/components/ui/sheet';
import { Textarea } from '@src/shared/components/ui/textarea';

// Helper functions for date calculations
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getNextMonthDate = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString().split('T')[0];
};

export function ProductFormSheet({
  mode,
  open,
  onOpenChange,
  loanId,
}: {
  mode: 'new' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId?: string;
}) {
  const isNewMode = mode === 'new';

  // Mutations
  const createLoan = useCreateLoan();
  const updateLoan = useUpdateLoan();

  // Fetch loan data when in edit mode
  const { data: loanData, isLoading: isLoadingLoan } = useGetLoanById(
    loanId || '',
  );

  // Debug logging
  useEffect(() => {
    console.log('Edit Mode:', mode);
    console.log('Loan ID:', loanId);
    console.log('Loan Data:', loanData);
    console.log('Is Loading Loan:', isLoadingLoan);
  }, [mode, loanId, loanData, isLoadingLoan]);

  // Customer search
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [openCustomerCombo, setOpenCustomerCombo] = useState(false);
  const { data: customersData } = useSearchCustomers(customerSearchQuery);

  // Form state - Section 1: ข้อมูลพื้นฐาน
  const [placeName, setPlaceName] = useState('');
  const [landNumber, setLandNumber] = useState('');
  const [landArea, setLandArea] = useState('');
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanStartDate, setLoanStartDate] = useState(getTodayDate());
  const [loanDueDate, setLoanDueDate] = useState(getNextMonthDate());
  const [landAccountId, setLandAccountId] = useState('');

  // Fetch land accounts for selection
  const { data: landAccountsData } = useGetLandAccountList({
    page: 1,
    limit: 1000,
  });

  // Form state - Section 2: ข้อมูลลูกค้า
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idCard, setIdCard] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [address, setAddress] = useState('');

  // Form state - Section 3: การคำนวณ
  const [loanYears, setLoanYears] = useState<number>(4);
  const [interestRate, setInterestRate] = useState<number>(1);
  const [operationFee, setOperationFee] = useState<number>(0);
  const [transferFee, setTransferFee] = useState<number>(0);
  const [otherFee, setOtherFee] = useState<number>(0);
  const [note, setNote] = useState('');

  // File upload - Title Deed Images
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // ไฟล์โฉนดใหม่ที่จะอัปโหลด
  const [existingImages, setExistingImages] = useState<string[]>([]); // รูปโฉนดที่มีอยู่แล้ว (URL)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload - Supporting Images
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]); // ไฟล์เพิ่มเติมใหม่ที่จะอัปโหลด
  const [existingSupportingImages, setExistingSupportingImages] = useState<
    string[]
  >([]); // รูปเพิ่มเติมที่มีอยู่แล้ว (URL)
  const supportingInputRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Calculations
  const totalInterest = useMemo(() => {
    return loanAmount * (interestRate / 100) * loanYears;
  }, [loanAmount, interestRate, loanYears]);

  const totalLoanAmount = useMemo(() => {
    return loanAmount + totalInterest;
  }, [loanAmount, totalInterest]);

  const monthlyPayment = useMemo(() => {
    if (loanAmount === 0 || loanYears === 0 || interestRate === 0) return 0;
    const n = loanYears * 12;
    const r = interestRate / 100 / 12;
    const pmt = (loanAmount * r) / (1 - Math.pow(1 + r, -n));
    return pmt;
  }, [loanAmount, loanYears, interestRate]);

  const actualPayment = useMemo(() => {
    return loanAmount - (operationFee + transferFee + otherFee);
  }, [loanAmount, operationFee, transferFee, otherFee]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // ID Card formatter
  const formatIdCard = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 1) return cleaned;
    if (cleaned.length <= 5)
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
    if (cleaned.length <= 10)
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
    if (cleaned.length <= 12)
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
  };

  // File upload handlers
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Supporting images handlers
  const handleSupportingFileClick = () => {
    supportingInputRef.current?.click();
  };

  const handleSupportingFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (files) {
      setSupportingFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveSupportingFile = (index: number) => {
    setSupportingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingSupportingImage = (index: number) => {
    setExistingSupportingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-fill customer data
  const handleSelectCustomer = (customer: {
    phoneNumber: string;
    profile?: {
      firstName?: string | null;
      lastName?: string | null;
      idCardNumber?: string | null;
      email?: string | null;
      dateOfBirth?: Date | null;
      address?: string | null;
    } | null;
  }) => {
    setPhoneNumber(customer.phoneNumber || '');
    setFullName(
      `${customer.profile?.firstName || ''} ${customer.profile?.lastName || ''}`.trim(),
    );
    setIdCard(customer.profile?.idCardNumber || '');
    setEmail(customer.profile?.email || '');
    if (customer.profile?.dateOfBirth) {
      setBirthDate(
        new Date(customer.profile.dateOfBirth).toISOString().split('T')[0],
      );
    }
    setAddress(customer.profile?.address || '');
    setOpenCustomerCombo(false);
  };

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // ตรวจสอบ form validation
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    try {
      const loanData = {
        customerName: fullName, // ใช้ fullName แทน customerName
        ownerName: fullName, // ใช้ fullName แทน ownerName (ชื่อเจ้าของที่ดินก็คือลูกค้า)
        placeName,
        landNumber,
        landArea,
        loanAmount,
        loanStartDate,
        loanDueDate,
        fullName,
        phoneNumber,
        idCard,
        email,
        birthDate,
        gender: gender || undefined,
        address,
        loanYears,
        interestRate,
        operationFee,
        transferFee,
        otherFee,
        note,
        landAccountId, // บัญชีสำหรับจ่ายสินเชื่อ
        titleDeedFiles: uploadedFiles, // ส่งไฟล์โฉนดใหม่ที่จะอัปโหลด
        existingImageUrls: existingImages, // ส่ง URL ของรูปโฉนดที่มีอยู่แล้ว
        supportingFiles: supportingFiles, // ส่งไฟล์เพิ่มเติมใหม่ที่จะอัปโหลด
        existingSupportingImageUrls: existingSupportingImages, // ส่ง URL ของรูปเพิ่มเติมที่มีอยู่แล้ว
      };

      if (isNewMode) {
        await createLoan.mutateAsync(loanData);
      } else if (loanId) {
        await updateLoan.mutateAsync({ id: loanId, data: loanData });
      }

      // Reset form and close
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setPlaceName('');
    setLandNumber('');
    setLandArea('');
    setLoanAmount(0);
    setLoanStartDate(getTodayDate());
    setLoanDueDate(getNextMonthDate());
    setLandAccountId('');
    setFullName('');
    setPhoneNumber('');
    setIdCard('');
    setEmail('');
    setBirthDate('');
    setGender('');
    setAddress('');
    setLoanYears(4);
    setInterestRate(1);
    setOperationFee(0);
    setTransferFee(0);
    setOtherFee(0);
    setNote('');
    setUploadedFiles([]);
    setExistingImages([]);
    setSupportingFiles([]);
    setExistingSupportingImages([]);
    setCustomerSearchQuery('');
  };

  // Load data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && loanData?.data && open && loanId) {
      const loan = loanData.data;

      console.log('Loading loan data into form:', loan);

      // Section 1: ข้อมูลพื้นฐาน
      setPlaceName(loan.application?.propertyLocation || '');
      setLandNumber(loan.titleDeedNumber || '');
      setLandArea(loan.application?.propertyArea || '');
      setLoanAmount(Number(loan.principalAmount));
      setLoanStartDate(new Date(loan.contractDate).toISOString().split('T')[0]);
      setLoanDueDate(new Date(loan.expiryDate).toISOString().split('T')[0]);

      // Section 2: ข้อมูลลูกค้า
      const firstName = loan.customer?.profile?.firstName || '';
      const lastName = loan.customer?.profile?.lastName || '';
      setFullName(`${firstName} ${lastName}`.trim());
      setPhoneNumber(loan.customer?.phoneNumber || '');
      setIdCard(loan.customer?.profile?.idCardNumber || '');
      setEmail(loan.customer?.profile?.email || '');
      if (loan.customer?.profile?.dateOfBirth) {
        setBirthDate(
          new Date(loan.customer.profile.dateOfBirth)
            .toISOString()
            .split('T')[0],
        );
      }
      setAddress(loan.customer?.profile?.address || '');

      // Section 3: การคำนวณ
      setLoanYears(loan.termMonths / 12);
      setInterestRate(Number(loan.interestRate));
      // Note: operation fees ไม่ได้เก็บใน schema ตอนนี้

      // Load existing title deed images
      const titleDeedImages: string[] = [];
      if (loan.application?.titleDeedImage) {
        titleDeedImages.push(loan.application.titleDeedImage);
      }
      setExistingImages(titleDeedImages);

      // Load existing supporting images
      const supportingImgs: string[] = [];
      if (
        loan.application?.supportingImages &&
        Array.isArray(loan.application.supportingImages)
      ) {
        supportingImgs.push(...loan.application.supportingImages);
      }
      setExistingSupportingImages(supportingImgs);
    }
  }, [mode, loanData, open, loanId]);

  // Reset form when closing
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 lg:w-[1080px] sm:max-w-none inset-5 border start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="font-medium gradientText">
            {isNewMode ? 'เพิ่มสินเชื่อ' : 'แก้ไขสินเชื่อ'}
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between gap-2 flex-wrap border-b border-border p-5">
            <div className="flex items-center gap-2.5 text-xs text-gray-800 font-medium">
              <Link
                href="#"
                className="text-primary"
                onClick={(e) => {
                  e.preventDefault(); // ป้องกันการเปลี่ยนหน้า
                  alert('In development');
                }}
              >
                คู่มือการเพิ่มสินเชื่อ
              </Link>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                form="loan-form"
                variant="mono"
                className="gradientButton"
                disabled={
                  createLoan.isPending ||
                  updateLoan.isPending ||
                  (mode === 'edit' && isLoadingLoan)
                }
              >
                {createLoan.isPending || updateLoan.isPending
                  ? 'กำลังบันทึก...'
                  : mode === 'edit' && isLoadingLoan
                    ? 'กำลังโหลดข้อมูล...'
                    : isNewMode
                      ? 'บันทึก'
                      : 'บันทึกการแก้ไข'}
              </Button>
            </div>
          </div>

          {/* Loading state for edit mode */}
          {mode === 'edit' && isLoadingLoan ? (
            <div className="flex items-center justify-center h-[calc(100dvh-15.2rem)]">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-2 text-sm text-muted-foreground">
                  กำลังโหลดข้อมูลสินเชื่อ...
                </p>
              </div>
            </div>
          ) : (
            /* Scroll */
            <form ref={formRef} id="loan-form" onSubmit={handleSubmit}>
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-15.2rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                  <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                    {/* Section 1: ข้อมูลพื้นฐาน */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[38px] bg-accent/50">
                        <CardTitle className="text-2sm">
                          ข้อมูลพื้นฐาน
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2 md:col-span-2">
                            <Label className="text-xs">ชื่อสถานที่</Label>
                            <Input
                              placeholder="กรอกชื่อสถานที่"
                              value={placeName}
                              onChange={(e) => setPlaceName(e.target.value)}
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs">
                              เลขที่ดิน{' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="กรอกเลขที่ดิน"
                              value={landNumber}
                              onChange={(e) => setLandNumber(e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs">
                              เนื้อที่{' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="เช่น 0.0.40"
                              value={landArea}
                              onChange={(e) => setLandArea(e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs">
                              วันที่ออกสินเชื่อ{' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              type="date"
                              value={loanStartDate}
                              onChange={(e) => setLoanStartDate(e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <Label className="text-xs">
                              กำหนดชำระสินเชื่อ{' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              type="date"
                              value={loanDueDate}
                              onChange={(e) => setLoanDueDate(e.target.value)}
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-2">
                            <Label className="text-xs">
                              ยอดสินเชื่อ (ไม่รวม VAT){' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="0.00"
                                value={
                                  loanAmount
                                    ? loanAmount.toLocaleString('th-TH', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 2,
                                      })
                                    : ''
                                }
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /,/g,
                                    '',
                                  );
                                  setLoanAmount(parseFloat(value) || 0);
                                }}
                                className="pr-12"
                                required
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                บาท
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 md:col-span-2">
                            <Label className="text-xs">
                              บัญชีสำหรับจ่ายสินเชื่อ{' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Select
                              value={landAccountId}
                              onValueChange={setLandAccountId}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกบัญชี" />
                              </SelectTrigger>
                              <SelectContent>
                                {landAccountsData?.data?.map((account: any) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.accountName} (฿
                                    {Number(account.accountBalance).toLocaleString('th-TH', {
                                      minimumFractionDigits: 2,
                                    })}
                                    )
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section 2: ข้อมูลลูกค้า */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[38px] bg-accent/50">
                        <CardTitle className="text-2sm">ข้อมูลลูกค้า</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2 md:col-span-2">
                            <Label className="text-xs">
                              เบอร์ติดต่อ{' '}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Popover
                              open={openCustomerCombo}
                              onOpenChange={setOpenCustomerCombo}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={openCustomerCombo}
                                  className="w-full justify-between font-normal"
                                >
                                  {phoneNumber ||
                                    'ค้นหาเบอร์โทรลูกค้า หรือเพิ่มลูกค้าใหม่...'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-full p-0"
                                align="start"
                              >
                                <Command>
                                  <CommandInput
                                    placeholder="พิมพ์เบอร์โทรหรือชื่อลูกค้า..."
                                    value={customerSearchQuery}
                                    onValueChange={setCustomerSearchQuery}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      <div className="py-6 text-center text-sm">
                                        <p className="text-muted-foreground">
                                          ไม่พบลูกค้า
                                        </p>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="mt-2 text-primary"
                                          onClick={() => {
                                            setPhoneNumber(customerSearchQuery);
                                            setOpenCustomerCombo(false);
                                          }}
                                        >
                                          ใช้เบอร์ "{customerSearchQuery}"
                                          สำหรับลูกค้าใหม่
                                        </Button>
                                      </div>
                                    </CommandEmpty>
                                    <CommandGroup heading="ลูกค้าที่พบ">
                                      {customersData?.data?.map(
                                        (customer: {
                                          id: string;
                                          phoneNumber: string;
                                          profile?: {
                                            firstName?: string | null;
                                            lastName?: string | null;
                                          } | null;
                                        }) => {
                                          const displayName =
                                            `${customer.profile?.firstName || ''} ${customer.profile?.lastName || ''}`.trim();
                                          return (
                                            <CommandItem
                                              key={customer.id}
                                              value={customer.phoneNumber}
                                              onSelect={() =>
                                                handleSelectCustomer(customer)
                                              }
                                            >
                                              <Check
                                                className={cn(
                                                  'mr-2 h-4 w-4',
                                                  phoneNumber ===
                                                    customer.phoneNumber
                                                    ? 'opacity-100'
                                                    : 'opacity-0',
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-medium">
                                                  {customer.phoneNumber}
                                                </span>
                                                {displayName && (
                                                  <span className="text-xs text-muted-foreground">
                                                    {displayName}
                                                  </span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          );
                                        },
                                      )}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* แสดง input อื่นๆ เฉพาะเมื่อใส่เบอร์โทรแล้ว */}
                          {phoneNumber ? (
                            <>
                              <div className="flex flex-col gap-2 md:col-span-2">
                                <div className="text-xs text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-800">
                                  ✓ เบอร์โทร:{' '}
                                  <span className="font-medium">
                                    {phoneNumber}
                                  </span>{' '}
                                  -
                                  ตรวจสอบความถูกต้องของข้อมูลลูกค้าได้ที่ด้านล่าง
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label className="text-xs">
                                  ชื่อ-นามสกุล{' '}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  placeholder="กรอกชื่อ-นามสกุล"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label className="text-xs">
                                  เลขบัตรประชาชน{' '}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  placeholder="X-XXXX-XXXXX-XX-X"
                                  value={idCard}
                                  onChange={(e) => {
                                    const formatted = formatIdCard(
                                      e.target.value,
                                    );
                                    setIdCard(formatted);
                                  }}
                                  maxLength={17}
                                  required
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label className="text-xs">อีเมล</Label>
                                <Input
                                  type="email"
                                  placeholder="example@email.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label className="text-xs">
                                  วัน/เดือน/ปีเกิด
                                </Label>
                                <Input
                                  type="date"
                                  value={birthDate}
                                  onChange={(e) => setBirthDate(e.target.value)}
                                />
                              </div>

                              <div className="flex flex-col gap-2">
                                <Label className="text-xs">เพศ</Label>
                                <Select
                                  value={gender}
                                  onValueChange={(value) =>
                                    setGender(
                                      value as 'male' | 'female' | 'other',
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="เลือกเพศ" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">ชาย</SelectItem>
                                    <SelectItem value="female">หญิง</SelectItem>
                                    <SelectItem value="other">
                                      ไม่ระบุ
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex flex-col gap-2 md:col-span-2">
                                <Label className="text-xs">ที่อยู่</Label>
                                <Textarea
                                  placeholder="กรอกที่อยู่ทั้งหมด"
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  className="min-h-[80px]"
                                />
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-2 md:col-span-2 py-8 text-center">
                              <div className="text-sm text-muted-foreground">
                                กรุณาเลือกเบอร์ติดต่อลูกค้าก่อน
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ระบบจะแสดงฟิลด์ข้อมูลลูกค้าอื่นๆ
                                หลังจากเลือกเบอร์โทร
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Section 3: ข้อมูลการคำนวณรายการสินเชื่อ */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[38px] bg-accent/50">
                        <CardTitle className="text-2sm">
                          ข้อมูลการคำนวณรายการสินเชื่อ
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {/* Input Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                            <div className="flex flex-col gap-2">
                              <Label className="text-xs">ยอดสินเชื่อ</Label>
                              <div className="relative">
                                <Input
                                  type="text"
                                  value={formatCurrency(loanAmount)}
                                  className="pr-12 bg-accent/30"
                                  disabled
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label className="text-xs">
                                จำนวนปี{' '}
                                <span className="text-destructive">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={loanYears}
                                  onChange={(e) =>
                                    setLoanYears(
                                      parseFloat(e.target.value) || 1,
                                    )
                                  }
                                  min={1}
                                  step={1}
                                  className="pr-12"
                                  required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  ปี
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label className="text-xs">
                                ดอกเบี้ย/ปี{' '}
                                <span className="text-destructive">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={interestRate}
                                  onChange={(e) =>
                                    setInterestRate(
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  min={0}
                                  step={0.01}
                                  className="pr-12"
                                  required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Calculated Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                            <div className="flex flex-col gap-2">
                              <Label className="text-xs text-muted-foreground">
                                ยอดดอกเบี้ยรวม
                              </Label>
                              <div className="relative">
                                <Input
                                  type="text"
                                  value={formatCurrency(totalInterest)}
                                  className="pr-12 bg-accent/50 font-medium"
                                  disabled
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label className="text-xs text-muted-foreground">
                                ยอดสินเชื่อรวม
                              </Label>
                              <div className="relative">
                                <Input
                                  type="text"
                                  value={formatCurrency(totalLoanAmount)}
                                  className="pr-12 bg-accent/50 font-medium"
                                  disabled
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                              <Label className="text-xs text-muted-foreground">
                                งวดละ (รายเดือน)
                              </Label>
                              <div className="relative">
                                <Input
                                  type="text"
                                  value={formatCurrency(monthlyPayment)}
                                  className="pr-12 bg-accent/50 font-medium text-primary"
                                  disabled
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท/เดือน
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Fees Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                            <div className="flex flex-col gap-2">
                              <Label className="text-xs">ค่าดำเนินการ</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={operationFee || ''}
                                  onChange={(e) =>
                                    setOperationFee(
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  min={0}
                                  step={0.01}
                                  className="pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label className="text-xs">ค่าโอน</Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={transferFee || ''}
                                  onChange={(e) =>
                                    setTransferFee(
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  min={0}
                                  step={0.01}
                                  className="pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label className="text-xs">
                                ค่าใช้จ่ายอื่น ๆ
                              </Label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  value={otherFee || ''}
                                  onChange={(e) =>
                                    setOtherFee(parseFloat(e.target.value) || 0)
                                  }
                                  min={0}
                                  step={0.01}
                                  className="pr-12"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label className="text-xs text-muted-foreground">
                                ยอดจ่ายจริง
                              </Label>
                              <div className="relative">
                                <Input
                                  type="text"
                                  value={formatCurrency(actualPayment)}
                                  className="pr-12 bg-accent/50 font-medium text-success"
                                  disabled
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  บาท
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Note Section */}
                          <div className="flex flex-col gap-2">
                            <Label className="text-xs">หมายเหตุ</Label>
                            <Textarea
                              placeholder="กรอกหมายเหตุเพิ่มเติม"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Bar */}
                    <Card className="rounded-md bg-primary/5 border-primary/20">
                      <CardContent className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              ยอดสินเชื่อรวม
                            </div>
                            <div className="text-lg font-semibold text-foreground">
                              ฿{formatCurrency(totalLoanAmount)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              งวดละ (รายเดือน)
                            </div>
                            <div className="text-lg font-semibold text-primary">
                              ฿{formatCurrency(monthlyPayment)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              ยอดจ่ายจริง
                            </div>
                            <div className="text-lg font-semibold text-success">
                              ฿{formatCurrency(actualPayment)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Side Section */}
                  <div className="w-full lg:w-[420px] shrink-0 lg:mt-5 space-y-5 lg:ps-5">
                    {/* อัพโหลดโฉนด */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[38px] bg-accent/50">
                        <CardTitle className="text-2sm">
                          อัพโหลดโฉนด (ไม่บังคับ)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div
                            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={handleFileClick}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-muted-foreground"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                คลิกเพื่ออัพโหลดรูปโฉนด
                              </div>
                              <div className="text-xs text-muted-foreground">
                                รองรับไฟล์ JPG, PNG, PDF (สูงสุด 10MB)
                              </div>
                            </div>
                          </div>
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            multiple
                            onChange={handleFileChange}
                          />

                          {/* Preview area */}
                          {existingImages.length > 0 ||
                          uploadedFiles.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {/* รูปที่มีอยู่แล้ว */}
                              {existingImages.map((imageUrl, index) => (
                                <div
                                  key={`existing-${index}`}
                                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-green-500 bg-green-50 dark:bg-green-950/20"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`รูปโฉนด ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        window.open(imageUrl, '_blank')
                                      }
                                      title="ดูรูปภาพ"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        handleRemoveExistingImage(index)
                                      }
                                      title="ลบรูปภาพ"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                  <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                                    บันทึกแล้ว
                                  </div>
                                </div>
                              ))}

                              {/* ไฟล์ใหม่ที่จะอัปโหลด */}
                              {uploadedFiles.map((file, index) => (
                                <div
                                  key={`new-${index}`}
                                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-primary bg-accent"
                                >
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleRemoveFile(index)}
                                      title="ลบรูปภาพ"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                  <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                                    ใหม่
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">
                              ยังไม่มีไฟล์ที่อัพโหลด
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* อัพโหลดภาพเพิ่มเติม */}
                    <Card className="rounded-md">
                      <CardHeader className="min-h-[38px] bg-accent/50">
                        <CardTitle className="text-2sm">
                          อัพโหลดภาพเพิ่มเติม (ไม่บังคับ)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div
                            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={handleSupportingFileClick}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center">
                                <svg
                                  className="w-6 h-6 text-muted-foreground"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                คลิกเพื่ออัพโหลดภาพเพิ่มเติม
                              </div>
                              <div className="text-xs text-muted-foreground">
                                รองรับไฟล์ JPG, PNG (สูงสุด 10MB/ไฟล์)
                              </div>
                            </div>
                          </div>
                          <Input
                            ref={supportingInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            multiple
                            onChange={handleSupportingFileChange}
                          />

                          {/* Preview area */}
                          {existingSupportingImages.length > 0 ||
                          supportingFiles.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {/* รูปที่มีอยู่แล้ว */}
                              {existingSupportingImages.map(
                                (imageUrl, index) => (
                                  <div
                                    key={`existing-supporting-${index}`}
                                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-green-500 bg-green-50 dark:bg-green-950/20"
                                  >
                                    <img
                                      src={imageUrl}
                                      alt={`รูปเพิ่มเติม ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          window.open(imageUrl, '_blank')
                                        }
                                        title="ดูรูปภาพ"
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                          />
                                        </svg>
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          handleRemoveExistingSupportingImage(
                                            index,
                                          )
                                        }
                                        title="ลบรูปภาพ"
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </Button>
                                    </div>
                                    <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                                      บันทึกแล้ว
                                    </div>
                                  </div>
                                ),
                              )}

                              {/* ไฟล์ใหม่ที่จะอัปโหลด */}
                              {supportingFiles.map((file, index) => (
                                <div
                                  key={`new-supporting-${index}`}
                                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-blue-500 bg-accent"
                                >
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        handleRemoveSupportingFile(index)
                                      }
                                      title="ลบรูปภาพ"
                                    >
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                    ใหม่
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground text-center">
                              ยังไม่มีไฟล์ที่อัพโหลด
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </form>
          )}
        </SheetBody>

        <SheetFooter className="flex-row border-t justify-between items-center p-5 border-border gap-2">
          <div className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> ระบุข้อมูลที่จำเป็น
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              form="loan-form"
              variant="mono"
              className="gradientButton"
              disabled={createLoan.isPending || updateLoan.isPending}
            >
              {createLoan.isPending || updateLoan.isPending
                ? 'กำลังบันทึก...'
                : isNewMode
                  ? 'บันทึก'
                  : 'บันทึกการแก้ไข'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
