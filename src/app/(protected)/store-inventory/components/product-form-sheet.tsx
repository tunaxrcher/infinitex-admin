'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@src/shared/components/ui/button';
import { useCreateLoan, useUpdateLoan } from '@src/features/loans/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
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

  // Form state - Section 1: ข้อมูลพื้นฐาน
  const [customerName, setCustomerName] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [landNumber, setLandNumber] = useState('');
  const [landArea, setLandArea] = useState('');
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [loanStartDate, setLoanStartDate] = useState('');
  const [loanDueDate, setLoanDueDate] = useState('');

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

  // File upload
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Phone number formatter
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5)
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    if (cleaned.length <= 9)
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}`;
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

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const loanData = {
        customerName,
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
    setCustomerName('');
    setPlaceName('');
    setLandNumber('');
    setLandArea('');
    setLoanAmount(0);
    setLoanStartDate('');
    setLoanDueDate('');
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
  };

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
          <SheetTitle className="font-medium">
            {isNewMode ? 'เพิ่มสินเชื่อ' : 'แก้ไขสินเชื่อ'}
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between gap-2 flex-wrap border-b border-border p-5">
            <div className="flex items-center gap-2.5 text-xs text-gray-800 font-medium">
              <Link href="#" className="text-primary">
                คู่มือการเพิ่มสินเชื่อ
              </Link>
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ยกเลิก
              </Button>
              <Button variant="mono" onClick={handleSubmit} disabled={createLoan.isPending || updateLoan.isPending}>
                {createLoan.isPending || updateLoan.isPending ? 'กำลังบันทึก...' : (isNewMode ? 'บันทึก' : 'บันทึกการแก้ไข')}
              </Button>
            </div>
          </div>

          {/* Scroll */}
          <ScrollArea
            className="flex flex-col h-[calc(100dvh-15.2rem)] mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                {/* Section 1: ข้อมูลพื้นฐาน */}
                <Card className="rounded-md">
                  <CardHeader className="min-h-[38px] bg-accent/50">
                    <CardTitle className="text-2sm">ข้อมูลพื้นฐาน</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <Label className="text-xs">
                          ชื่อลูกค้า <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="กรอกชื่อลูกค้า"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                        />
                      </div>

              

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
                          เลขที่ดิน <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          placeholder="กรอกเลขที่ดิน"
                          value={landNumber}
                          onChange={(e) => setLandNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-xs">เนื้อที่</Label>
                        <Input
                          placeholder="เช่น 2-3-50 ไร่"
                          value={landArea}
                          onChange={(e) => setLandArea(e.target.value)}
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
                            type="number"
                            placeholder="0.00"
                            value={loanAmount || ''}
                            onChange={(e) =>
                              setLoanAmount(parseFloat(e.target.value) || 0)
                            }
                            min={0}
                            step={0.01}
                            className="pr-12"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
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
                          เบอร์ติดต่อ{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          type="tel"
                          placeholder="0X-XXX-XXXX"
                          value={phoneNumber}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setPhoneNumber(formatted);
                          }}
                          maxLength={12}
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
                            const formatted = formatIdCard(e.target.value);
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
                        <Label className="text-xs">วัน/เดือน/ปีเกิด</Label>
                        <Input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                        />
                      </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-xs">เพศ</Label>
                      <Select value={gender} onValueChange={(value) => setGender(value as 'male' | 'female' | 'other')}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกเพศ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ชาย</SelectItem>
                          <SelectItem value="female">หญิง</SelectItem>
                          <SelectItem value="other">ไม่ระบุ</SelectItem>
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
                          <Label className="text-xs">จำนวนปี</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={loanYears}
                              onChange={(e) =>
                                setLoanYears(parseFloat(e.target.value) || 1)
                              }
                              min={1}
                              step={1}
                              className="pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              ปี
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label className="text-xs">ดอกเบี้ย/ปี</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={interestRate}
                              onChange={(e) =>
                                setInterestRate(parseFloat(e.target.value) || 0)
                              }
                              min={0}
                              step={0.01}
                              className="pr-12"
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
                                setOperationFee(parseFloat(e.target.value) || 0)
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
                                setTransferFee(parseFloat(e.target.value) || 0)
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
                          <Label className="text-xs">ค่าใช้จ่ายอื่น ๆ</Label>
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
                    <CardTitle className="text-2sm">อัพโหลดโฉนด</CardTitle>
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
                      {uploadedFiles.length > 0 ? (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-accent/30 rounded border border-border"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <svg
                                  className="w-4 h-4 text-primary shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-xs truncate">
                                  {file.name}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => handleRemoveFile(index)}
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
        </SheetBody>

        <SheetFooter className="flex-row border-t justify-between items-center p-5 border-border gap-2">
          <div className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> ระบุข้อมูลที่จำเป็น
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button variant="mono" onClick={handleSubmit} disabled={createLoan.isPending || updateLoan.isPending}>
              {createLoan.isPending || updateLoan.isPending ? 'กำลังบันทึก...' : (isNewMode ? 'บันทึก' : 'บันทึกการแก้ไข')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
