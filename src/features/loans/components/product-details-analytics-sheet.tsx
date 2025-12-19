'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useGetLandAccountList } from '@src/features/land-accounts/hooks';
import {
  useCloseLoan,
  useDeleteLoan,
  useGenerateInstallments,
  useGetLoanById,
  usePayInstallment,
} from '@src/features/loans/hooks';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge, BadgeDot } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
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
import { Skeleton } from '@src/shared/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/shared/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@src/shared/components/ui/tabs';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@src/shared/components/ui/toggle-group';
import { CoreFinancialRatios } from './core-financial-ratios';

export function ProductDetailsAnalyticsSheet({
  open,
  onOpenChange,
  loanId,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId?: string;
  onEdit?: () => void;
}) {
  // Mockdata
  // Chart data for Recharts
  const salesPriceData = [
    { value: 30 },
    { value: 38 },
    { value: 35 },
    { value: 42 },
    { value: 40 },
    { value: 45 },
    { value: 55 },
  ];

  const salesData = [
    { value: 28 },
    { value: 50 },
    { value: 36 },
    { value: 42 },
    { value: 38 },
    { value: 45 },
    { value: 50 },
  ];

  // Fetch loan data from API
  const { data: loanResponse, isLoading } = useGetLoanById(loanId || '');
  const loan = loanResponse?.data;
  const deleteLoan = useDeleteLoan();
  const generateInstallments = useGenerateInstallments();
  const payInstallment = usePayInstallment();
  const closeLoan = useCloseLoan();

  // Handle delete
  const handleDelete = () => {
    if (!loanId) return;

    if (
      confirm(
        'คุณต้องการลบสินเชื่อนี้ใช่หรือไม่?\n\nการลบจะเปลี่ยนสถานะเป็น CANCELLED และไม่สามารถกู้คืนได้',
      )
    ) {
      deleteLoan.mutate(loanId, {
        onSuccess: () => {
          onOpenChange(false); // ปิด modal หลังลบสำเร็จ
        },
      });
    }
  };

  // Get installments from loan data
  const installments = loan?.installments || [];

  // Check if there are overdue installments
  const hasOverdueInstallments = installments.some(
    (inst: any) => !inst.isPaid && new Date(inst.dueDate) < new Date(),
  );

  // Calculate overdue days from oldest overdue installment
  const overdueInstallments = installments.filter(
    (inst: any) => !inst.isPaid && new Date(inst.dueDate) < new Date(),
  );
  const oldestOverdueInstallment =
    overdueInstallments.length > 0
      ? overdueInstallments.reduce((oldest: any, current: any) =>
          new Date(current.dueDate) < new Date(oldest.dueDate)
            ? current
            : oldest,
        )
      : null;
  const overdueDays = oldestOverdueInstallment
    ? Math.floor(
        (new Date().getTime() -
          new Date(oldestOverdueInstallment.dueDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Calculate remaining interest for display
  const calculateRemainingInterest = (installmentNumber: number) => {
    const remainingInstallments =
      (loan?.totalInstallments || 0) - installmentNumber;
    const interestPerInstallment =
      (Number(loan?.principalAmount || 0) *
        (Number(loan?.interestRate || 0) / 100)) /
      (loan?.totalInstallments || 1);
    return remainingInstallments * interestPerInstallment;
  };

  // Payment schedule table (ตารางการชำระเงิน) - show all installments
  const paymentSchedule = installments.map(
    (inst: {
      id: string;
      installmentNumber: number;
      dueDate: Date;
      paidDate?: Date;
      totalAmount: number;
      principalAmount: number;
      interestAmount: number;
      isPaid: boolean;
      isLate: boolean;
      paidAmount?: number;
    }) => ({
      id: inst.id,
      installmentNumber: inst.installmentNumber,
      installment: inst.installmentNumber.toString(),
      receiver: '-', // TODO: เพิ่มข้อมูลผู้รับชำระ
      dueDate: new Date(inst.dueDate).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      paidDate: inst.paidDate
        ? new Date(inst.paidDate).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : '-',
      amount: `฿${Number(inst.totalAmount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      principalAmount: Number(inst.principalAmount),
      interestAmount: Number(inst.interestAmount),
      totalAmount: Number(inst.totalAmount),
      remainingInterest: calculateRemainingInterest(inst.installmentNumber),
      status: inst.isPaid ? 'ชำระแล้ว' : inst.isLate ? 'เกินกำหนด' : 'รอชำระ',
      paidAmount: inst.isPaid
        ? `฿${Number(inst.paidAmount).toLocaleString()}`
        : '-',
      isPaid: inst.isPaid,
      isLate: inst.isLate,
      rawData: inst,
    }),
  );

  // Prepare images for display
  const titleDeedImage = loan?.application?.titleDeedImage;
  const supportingImages = loan?.application?.supportingImages
    ? typeof loan.application.supportingImages === 'string'
      ? JSON.parse(loan.application.supportingImages)
      : loan.application.supportingImages
    : [];

  // Create images array with fallbacks
  const allImages: string[] = [];

  // Add title deed image or fallback
  if (titleDeedImage) {
    allImages.push(titleDeedImage);
  } else {
    allImages.push('/images/loan.png');
  }

  // Add supporting images or fallbacks
  if (supportingImages && supportingImages.length > 0) {
    allImages.push(...supportingImages);
  } else {
    // Add 5 loan.png images as fallback
    for (let i = 0; i < 5; i++) {
      allImages.push('/images/loan.png');
    }
  }

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isValuating, setIsValuating] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [isSavingValuation, setIsSavingValuation] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<{
    id: string;
    installment: string;
    receiver: string;
    totalAmount: number;
  } | null>(null);
  const [paymentTab, setPaymentTab] = useState('partial'); // 'partial' or 'full'

  // Fetch land accounts for selection
  const { data: landAccountsData } = useGetLandAccountList({
    page: 1,
    limit: 1000,
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    installmentNumber: '',
    paymentAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    receiver: '',
    landAccountId: '',
  });

  // Close loan form state
  const [closeLoanForm, setCloseLoanForm] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    landAccountId: '',
    paymentMethod: '',
    receiver: '',
  });

  // Prevent auto-focus when sheet opens and reset tab
  useEffect(() => {
    if (open) {
      // Reset to details tab when opening
      setActiveTab('details');

      // Blur any focused element when sheet opens
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [open, loanId]); // Add loanId to dependencies to reset when viewing different loan

  // Load existing valuation result
  useEffect(() => {
    if (loan?.valuationResult) {
      setValuationResult(loan.valuationResult);
    } else {
      setValuationResult(null); // Clear previous result
    }
  }, [loan]);

  // Calculate Core Financial Ratios (Memoized)
  const financialRatios = useMemo(() => {
    if (!loan) return null;

    const principalAmount = Number(loan.principalAmount || 0);
    const interestRate = Number(loan.interestRate || 0);
    const currentInstallment = Number(loan.currentInstallment || 0);
    const totalInstallments = Number(loan.totalInstallments || 0);
    const estimatedValue = Number(loan.estimatedValue || 0);
    const contractDate = loan.contractDate ? new Date(loan.contractDate) : null;
    const today = new Date();

    // Calculate months passed since contract
    const monthsPassed = contractDate
      ? Math.max(
          1,
          Math.floor(
            (today.getTime() - contractDate.getTime()) /
              (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 1;

    // Get paid installments
    const paidInstallments = installments.filter((inst: any) => inst.isPaid);
    const totalInterestEarned = paidInstallments.reduce(
      (sum: number, inst: any) => sum + Number(inst.interestAmount || 0),
      0,
    );

    // 1. ROI (Return on Investment)
    const roi =
      principalAmount > 0 ? (totalInterestEarned / principalAmount) * 100 : 0;

    // 2. IRR (Internal Rate of Return) - simplified annualized version
    const irr =
      principalAmount > 0
        ? (totalInterestEarned / principalAmount) * (12 / monthsPassed) * 100
        : 0;

    // 3. P/Loan (Price-to-Loan) - using mock market value
    const mockMarketValue = principalAmount * 4.17;
    const pToLoan = principalAmount > 0 ? mockMarketValue / principalAmount : 0;

    // 4. LTV (Loan-to-Value)
    const ltv =
      estimatedValue > 0 ? (principalAmount / estimatedValue) * 100 : null;

    // 5. NIM (Net Interest Margin)
    const nim =
      principalAmount > 0 ? (totalInterestEarned / principalAmount) * 100 : 0;

    // 6. Duration (Tenor Remaining)
    const remainingInstallments = totalInstallments - currentInstallment;
    const remainingMonths = remainingInstallments;

    // 7. YTD (Yield-to-Date) - Realized
    const ytdRealized =
      principalAmount > 0 && monthsPassed > 0
        ? (totalInterestEarned / principalAmount) * (12 / monthsPassed) * 100
        : 0;

    // 7b. YTD (Planned)
    const totalExpectedInterest = principalAmount * (interestRate / 100);
    const expectedInterestSoFar =
      (totalExpectedInterest / totalInstallments) * currentInstallment;
    const ytdPlanned =
      principalAmount > 0 && monthsPassed > 0
        ? (expectedInterestSoFar / principalAmount) * (12 / monthsPassed) * 100
        : 0;

    // 8. YTD Gap
    const ytdGap = Math.abs(ytdRealized - ytdPlanned);
    const ytdGapDirection: 'lag' | 'lead' =
      ytdRealized > ytdPlanned ? 'lag' : 'lead';

    return {
      roi,
      irr,
      pToLoan,
      ltv,
      nim,
      remainingMonths,
      ytdRealized,
      ytdPlanned,
      ytdGap,
      ytdGapDirection,
      monthsPassed,
    };
  }, [loan, installments]);

  // Handle property valuation
  const handleValuation = async () => {
    if (!loanId) {
      alert('ไม่พบข้อมูลสินเชื่อ');
      return;
    }

    console.log('[Valuation] Starting valuation for loan:', loanId);

    try {
      setIsValuating(true);

      // Validate that we have required data
      const titleDeedImage = loan?.application?.titleDeedImage;
      const supportingImages = loan?.application?.supportingImages
        ? typeof loan.application.supportingImages === 'string'
          ? JSON.parse(loan.application.supportingImages)
          : loan.application.supportingImages
        : [];

      console.log('[Valuation] Data check:', {
        hasTitleDeedImage: !!titleDeedImage,
        supportingImagesCount: supportingImages.length,
      });

      if (!titleDeedImage) {
        alert('ต้องมีรูปโฉนดเพื่อทำการประเมิน');
        setIsValuating(false);
        return;
      }

      if (!Array.isArray(supportingImages) || supportingImages.length === 0) {
        alert('ต้องมีรูปเพิ่มเติมอย่างน้อย 1 รูปเพื่อทำการประเมิน');
        setIsValuating(false);
        return;
      }

      console.log(
        '[Valuation] Calling API: /api/loans/' + loanId + '/valuation',
      );

      // Call valuation API (new endpoint that handles image fetching server-side)
      const response = await fetch(`/api/loans/${loanId}/valuation`, {
        method: 'POST',
      });

      console.log('[Valuation] API response status:', response.status);

      const result = await response.json();
      console.log('[Valuation] API result:', result);

      if (result.success) {
        setValuationResult(result);
        alert('ประเมินมูลค่าทรัพย์สินสำเร็จ');
      } else {
        alert(
          'เกิดข้อผิดพลาดในการประเมิน: ' + (result.error || 'Unknown error'),
        );
      }
    } catch (error) {
      console.error('[Valuation] Error:', error);
      alert(
        'เกิดข้อผิดพลาดในการประเมิน: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    } finally {
      setIsValuating(false);
    }
  };

  // Handle save valuation
  const handleSaveValuation = async () => {
    if (!loanId || !valuationResult) return;

    try {
      setIsSavingValuation(true);

      const response = await fetch(`/api/loans/${loanId}/save-valuation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valuationResult: valuationResult,
          estimatedValue:
            valuationResult.estimatedValue ||
            valuationResult.propertyValue ||
            0,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('บันทึกผลการประเมินสำเร็จ');
      } else {
        alert(
          'เกิดข้อผิดพลาดในการบันทึก: ' + (result.error || 'Unknown error'),
        );
      }
    } catch (error) {
      console.error('Save valuation error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSavingValuation(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 lg:w-[1080px] sm:max-w-none inset-5 border start-auto h-auto rounded-lg p-0 [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle
            tabIndex={0}
            className="focus:outline-none font-medium gradientText"
          >
            รายละเอียดและวิเคราะห์สินเชื่อ
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between gap-2 border-b border-border px-5 py-4">
            {isLoading ? (
              <>
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-28" />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[22px] font-semibold text-foreground leading-none">
                      {loan
                        ? loan.customer?.profile?.fullName || 'ไม่ระบุ'
                        : 'ไม่ระบุ'}
                    </span>
                    <div className="flex flex-col gap-1">
                      <Badge
                        size="sm"
                        variant={
                          loan?.status === 'ACTIVE'
                            ? hasOverdueInstallments
                              ? 'destructive'
                              : 'success'
                            : loan?.status === 'COMPLETED'
                              ? 'info'
                              : loan?.status === 'DEFAULTED'
                                ? 'destructive'
                                : 'warning'
                        }
                        appearance="light"
                      >
                        {loan?.status === 'ACTIVE'
                          ? hasOverdueInstallments
                            ? 'เกินกำหนดชำระ'
                            : 'ยังไม่ถึงกำหนด'
                          : loan?.status === 'COMPLETED'
                            ? 'ปิดบัญชี'
                            : loan?.status === 'DEFAULTED'
                              ? 'เกินกำหนดชำระ'
                              : 'รออนุมัติ'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 text-2sm">
                    <span className="font-normal text-muted-foreground">
                      เลขที่สินเชื่อ
                    </span>
                    <span className="font-medium text-foreground/80">
                      {loan?.loanNumber || '-'}
                    </span>
                    <BadgeDot className="bg-muted-foreground/60 size-1 mx-1" />
                    <span className="font-normal text-muted-foreground">
                      วันที่ออกสินเชื่อ
                    </span>
                    <span className="font-medium text-foreground/80">
                      {loan?.contractDate
                        ? new Date(loan.contractDate).toLocaleDateString(
                            'th-TH',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            },
                          )
                        : '-'}
                    </span>
                    <BadgeDot className="bg-muted-foreground/60 size-1 mx-1" />
                    <span className="font-normal text-muted-foreground">
                      อัปเดตล่าสุด
                    </span>
                    <span className="font-medium text-foreground/80">
                      {loan?.updatedAt
                        ? new Date(loan.updatedAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {/* <Button variant="ghost">พิมพ์เอกสาร</Button> */}
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleteLoan.isPending}
                  >
                    {deleteLoan.isPending ? 'กำลังลบ...' : 'ลบ'}
                  </Button>
                  <Button
                    variant="mono"
                    className="gradientButton"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit?.();
                    }}
                  >
                    แก้ไขข้อมูล
                  </Button>
                </div>
              </>
            )}
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            <div className="border-b border-border px-5">
              <TabsList className="h-auto p-0 bg-transparent border-b-0 border-border rounded-none w-full">
                <div className="flex items-center gap-1 min-w-max">
                  <TabsTrigger
                    value="details"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    รายละเอียดสินเชื่อ
                    {activeTab === 'details' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ชำระสินเชื่อ
                    {activeTab === 'payment' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="valuation"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ประเมินมูลค่าทรัพย์สิน
                    {activeTab === 'valuation' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="contract"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    หนังสือสัญญากู้เงิน
                    {activeTab === 'contract' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ตารางผ่อนชำระ
                    {activeTab === 'schedule' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>

                  <TabsTrigger
                    value="cancel"
                    className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                  >
                    ยกเลิกสินเชื่อ
                    {activeTab === 'cancel' && (
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                    )}
                  </TabsTrigger>
                </div>
              </TabsList>
            </div>

            <TabsContent value="details" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                {isLoading ? (
                  <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                    <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                      {/* Loan Summary Skeleton */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-start flex-wrap lg:gap-10 gap-5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="flex flex-col gap-1.5">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-5 w-24" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Analytics Skeleton */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <Skeleton className="h-4 w-40" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-5 lg:gap-7.5 pt-4 pb-5">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-[100px] w-full" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-[100px] w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="w-full shrink-0 lg:w-[420px] py-5 lg:ps-5">
                      {/* Image Skeleton */}
                      <div className="mb-5">
                        <Skeleton className="h-[250px] w-full rounded-md mb-5" />
                        <div className="grid grid-cols-5 gap-4">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton
                              key={i}
                              className="h-[50px] w-full rounded-md"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Details Skeleton */}
                      <Skeleton className="h-16 w-full mb-5" />
                      <hr className="my-5 border-border" />
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="flex items-center gap-5">
                            <Skeleton className="h-4 w-[90px]" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                    <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                      {/* Loan Summary */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <CardTitle className="text-2sm">
                            สรุปสินเชื่อ
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-start flex-wrap lg:gap-10 gap-5">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-2sm font-normal text-secondary-foreground">
                                สถานะ
                              </span>
                              <span className="text-2sm font-medium text-foreground">
                                <div className="flex flex-col gap-1">
                                  <Badge
                                    variant={
                                      loan?.status === 'ACTIVE'
                                        ? hasOverdueInstallments
                                          ? 'destructive'
                                          : 'success'
                                        : loan?.status === 'COMPLETED'
                                          ? 'info'
                                          : loan?.status === 'DEFAULTED'
                                            ? 'destructive'
                                            : 'warning'
                                    }
                                    appearance="light"
                                  >
                                    {loan?.status === 'ACTIVE'
                                      ? hasOverdueInstallments
                                        ? 'เกินกำหนดชำระ ' +
                                          overdueDays +
                                          ' วัน'
                                        : 'ยังไม่ถึงกำหนด'
                                      : loan?.status === 'COMPLETED'
                                        ? 'ปิดบัญชี'
                                        : loan?.status === 'DEFAULTED'
                                          ? 'เกินกำหนดชำระ ' +
                                            overdueDays +
                                            ' วัน'
                                          : 'รออนุมัติ'}
                                  </Badge>
                                  {hasOverdueInstallments &&
                                    overdueDays > 0 && (
                                      <span className="text-xs text-destructive font-medium">
                                        เกินกำหนด {overdueDays} วัน
                                      </span>
                                    )}
                                </div>
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-2sm font-normal text-secondary-foreground">
                                วงเงิน
                              </span>
                              <span className="text-2sm font-medium text-foreground">
                                ฿
                                {loan
                                  ? Number(
                                      loan.principalAmount,
                                    ).toLocaleString()
                                  : '0'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-2sm font-normal text-secondary-foreground">
                                ยอดคงเหลือ
                              </span>
                              <span className="text-2sm font-medium text-foreground">
                                ฿
                                {loan
                                  ? Number(
                                      loan.remainingBalance,
                                    ).toLocaleString()
                                  : '0'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-2sm font-normal text-secondary-foreground">
                                งวดที่ชำระ
                              </span>
                              <span className="text-2sm font-medium text-foreground">
                                <Badge variant="info" appearance="light">
                                  {loan
                                    ? `${loan.currentInstallment}/${loan.totalInstallments}`
                                    : '0/0'}
                                </Badge>
                              </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-2sm font-normal text-secondary-foreground">
                                ดอกเบี้ย
                              </span>
                              <span className="text-2sm font-medium text-foreground">
                                {loan
                                  ? Number(loan.interestRate).toFixed(2)
                                  : '0'}
                                %
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Core Financial Ratios */}
                      <CoreFinancialRatios ratios={financialRatios} />

                      {/* Analytics */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <CardTitle className="text-2sm">
                            กราฟการวิเคราะห์ (In development)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-5 lg:gap-7.5 pt-4 pb-5">
                          <div className="space-y-1">
                            <div className="text-2sm font-normal text-secondary-foreground">
                              Demo...
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-semibold text-foreground">
                                $0,000,000.00
                              </span>
                              <Badge
                                size="xs"
                                variant="success"
                                appearance="light"
                              >
                                <TrendingUp />
                                3.5%
                              </Badge>
                            </div>

                            {/* Recharts Area Chart */}
                            <div className="relative">
                              <div className="h-[100px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={salesPriceData}
                                    margin={{
                                      top: 5,
                                      right: 5,
                                      left: 5,
                                      bottom: 5,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="salesPriceGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#4921EA"
                                          stopOpacity={0.15}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#4921EA"
                                          stopOpacity={0.02}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Tooltip
                                      cursor={{
                                        stroke: '#4921EA',
                                        strokeWidth: 1,
                                        strokeDasharray: '2 2',
                                      }}
                                      content={({ active, payload }) => {
                                        if (
                                          active &&
                                          payload &&
                                          payload.length
                                        ) {
                                          const value = payload[0]
                                            .value as number;
                                          return (
                                            <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-2 pointer-events-none">
                                              <p className="text-sm font-semibold text-foreground">
                                                ${value}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#4921EA"
                                      fill="url(#salesPriceGradient)"
                                      strokeWidth={1}
                                      dot={false}
                                      activeDot={{
                                        r: 4,
                                        fill: '#4921EA',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-2sm font-normal text-secondary-foreground">
                              Demo..
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-lg font-semibold text-foreground">
                                0,000.00
                              </span>
                              <Badge
                                size="xs"
                                variant="success"
                                appearance="light"
                              >
                                <TrendingUp />
                                18%
                              </Badge>
                              {/* <span className="text-2sm font-normal text-secondary-foreground ps-2.5">
                          0,000,000.00
                        </span> */}
                            </div>

                            {/* Recharts Area Chart */}
                            <div className="relative">
                              <div className="h-[100px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={salesData}
                                    margin={{
                                      top: 5,
                                      right: 5,
                                      left: 5,
                                      bottom: 5,
                                    }}
                                  >
                                    <defs>
                                      <linearGradient
                                        id="salesGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                      >
                                        <stop
                                          offset="0%"
                                          stopColor="#4921EA"
                                          stopOpacity={0.15}
                                        />
                                        <stop
                                          offset="100%"
                                          stopColor="#4921EA"
                                          stopOpacity={0.02}
                                        />
                                      </linearGradient>
                                    </defs>
                                    <Tooltip
                                      cursor={{
                                        stroke: '#4921EA',
                                        strokeWidth: 1,
                                        strokeDasharray: '2 2',
                                      }}
                                      content={({ active, payload }) => {
                                        if (
                                          active &&
                                          payload &&
                                          payload.length
                                        ) {
                                          const value = payload[0]
                                            .value as number;
                                          return (
                                            <div className="bg-background/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-2 pointer-events-none">
                                              <p className="text-sm font-semibold text-foreground">
                                                {value}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="value"
                                      stroke="#4921EA"
                                      fill="url(#salesGradient)"
                                      strokeWidth={1}
                                      dot={false}
                                      activeDot={{
                                        r: 4,
                                        fill: '#4921EA',
                                        stroke: 'white',
                                        strokeWidth: 2,
                                      }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="w-full shrink-0 lg:w-[420px] py-5 lg:ps-5">
                      <div className="mb-5">
                        <Card className="flex items-center justify-center rounded-md bg-accent/50 shadow-none shrink-0 mb-5">
                          <img
                            src={
                              allImages[selectedImageIndex] ||
                              '/images/loan.png'
                            }
                            className="h-[250px] shrink-0 object-cover w-full rounded-md"
                            alt="รูปหลักประกัน/โฉนด"
                          />
                        </Card>

                        <ToggleGroup
                          className="grid grid-cols-5 gap-4"
                          type="single"
                          value={selectedImageIndex.toString()}
                          onValueChange={(newValue) => {
                            if (newValue)
                              setSelectedImageIndex(parseInt(newValue));
                          }}
                        >
                          {allImages.slice(0, 5).map((image, index) => (
                            <ToggleGroupItem
                              key={index}
                              value={index.toString()}
                              className="rounded-md border border-border shrink-0 h-[50px] p-0 bg-accent/50 hover:bg-accent/50 data-[state=on]:border-zinc-950 dark:data-[state=on]:border-zinc-50"
                            >
                              <img
                                src={image || '/images/loan.png'}
                                className="h-[50px] w-[50px] object-cover rounded-md"
                                alt={`รูปที่ ${index + 1}`}
                              />
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                      <p className="text-2sm font-normal text-secondary-foreground leading-5 mb-5">
                        รายละเอียด (In development): Lorem ipsum dolor sit amet
                        consectetur adipisicing elit. Hic dolorum voluptatum
                        temporibus officia.
                      </p>

                      <hr className="my-5 border-border" />

                      <div className="space-y-3">
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            ประเภทสินเชื่อ
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.loanType === 'HOUSE_LAND_MORTGAGE'
                              ? 'จำนองบ้านและที่ดิน'
                              : 'เงินสด'}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            ระยะเวลา
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan
                              ? `${loan.termMonths / 12} ปี (${loan.termMonths} งวด)`
                              : '-'}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            อัตราดอกเบี้ย
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="primary" appearance="light">
                              {loan
                                ? Number(loan.interestRate).toFixed(2)
                                : '0'}
                              % ต่อปี
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            ความเสี่ยง
                          </div>
                          <div className="flex items-center gap-3.5">
                            <Badge variant="warning" appearance="outline">
                              ความเสี่ยงปานกลาง
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            สถานที่
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.application?.propertyLocation || '-'}
                            {loan?.application?.propertyArea
                              ? ` (${loan.application.propertyArea})`
                              : ''}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            ประเภททรัพย์
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.application?.propertyType || '-'}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            มูลค่าประเมิน
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.application?.propertyValue
                              ? `฿${Number(loan.application.propertyValue).toLocaleString()}`
                              : '-'}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            โฉนด
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.titleDeedNumber ||
                              loan?.application?.landNumber ||
                              '-'}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            เจ้าของ
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.application?.ownerName || '-'}
                          </div>
                        </div>
                        <div className="flex items-center lg:gap-13 gap-5">
                          <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                            วงเงินที่ขอ
                          </div>
                          <div className="text-2sm text-secondary-foreground font-medium">
                            {loan?.application?.requestedAmount
                              ? `฿${Number(loan.application.requestedAmount).toLocaleString()}`
                              : '-'}
                          </div>
                        </div>
                        {loan?.application?.approvedAmount && (
                          <div className="flex items-center lg:gap-13 gap-5">
                            <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                              วงเงินอนุมัติ
                            </div>
                            <div className="text-2sm text-secondary-foreground font-medium">
                              ฿
                              {Number(
                                loan.application.approvedAmount,
                              ).toLocaleString()}
                            </div>
                          </div>
                        )}
                        {loan?.application?.maxApprovedAmount && (
                          <div className="flex items-center lg:gap-13 gap-5">
                            <div className="text-2sm text-secondary-foreground font-normal min-w-[90px]">
                              วงเงินสูงสุด
                            </div>
                            <div className="text-2sm text-secondary-foreground font-medium">
                              ฿
                              {Number(
                                loan.application.maxApprovedAmount,
                              ).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="contract" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex items-center justify-center h-full px-3.5 py-10">
                  {loanId ? (
                    <iframe
                      src={`/api/loans/${loanId}/contract-pdf`}
                      className="w-full h-full border rounded-md"
                      title="หนังสือสัญญากู้เงิน"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      ไม่พบข้อมูลสินเชื่อ
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex items-center justify-center h-full px-3.5 py-10">
                  {loanId ? (
                    <iframe
                      src={`/api/loans/${loanId}/installment-pdf`}
                      className="w-full h-full border rounded-md"
                      title="ตารางผ่อนชำระ"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      ไม่พบข้อมูลสินเชื่อ
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="payment" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="px-3.5 py-5">
                  {/* Payment Schedule table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-secondary-foreground font-normal text-2sm">
                          <TableHead className="w-[70px] h-8.5 border-e border-border ps-5">
                            งวด
                          </TableHead>
                          <TableHead className="w-[140px] h-8.5 border-e border-border">
                            ผู้รับชำระ
                          </TableHead>
                          <TableHead className="w-[120px] h-8.5 border-e border-border text-right pe-3">
                            ยอดชำระ
                          </TableHead>
                          <TableHead className="w-[120px] h-8.5 border-e border-border text-right pe-3">
                            ดอกเบี้ยคงเหลือ
                          </TableHead>
                          <TableHead className="w-[110px] h-8.5 border-e border-border">
                            กำหนดชำระ
                          </TableHead>
                          <TableHead className="w-[110px] h-8.5 border-e border-border">
                            วันชำระจริง
                          </TableHead>
                          <TableHead className="w-[100px] h-8.5 border-e border-border">
                            สถานะ
                          </TableHead>
                          <TableHead className="w-[120px] h-8.5 text-center">
                            การดำเนินการ
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {isLoading ? (
                          // Skeleton rows
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow
                              key={index}
                              className={`text-secondary-foreground font-normal text-2sm ${index % 2 === 0 ? 'bg-accent/50' : ''}`}
                            >
                              <TableCell className="py-2 border-e border-border ps-5">
                                <Skeleton className="h-4 w-8" />
                              </TableCell>
                              <TableCell className="py-2 border-e border-border">
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell className="py-2 border-e border-border">
                                <Skeleton className="h-4 w-20 ml-auto" />
                              </TableCell>
                              <TableCell className="py-2 border-e border-border">
                                <Skeleton className="h-4 w-20 ml-auto" />
                              </TableCell>
                              <TableCell className="py-2 border-e border-border">
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell className="py-2 border-e border-border">
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell className="py-2 border-e border-border">
                                <Skeleton className="h-6 w-20" />
                              </TableCell>
                              <TableCell className="text-center py-2">
                                <Skeleton className="h-8 w-24 mx-auto" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : paymentSchedule.length > 0 ? (
                          paymentSchedule.map(
                            (
                              payment: {
                                id: string;
                                installment: string;
                                receiver: string;
                                amount: string;
                                remainingInterest: number;
                                dueDate: string;
                                paidDate: string;
                                status: string;
                                isLate: boolean;
                                isPaid: boolean;
                                totalAmount: number;
                              },
                              index: number,
                            ) => (
                              <TableRow
                                key={payment.id}
                                className={`text-secondary-foreground font-normal text-2sm ${index % 2 === 0 ? 'bg-accent/50' : ''}`}
                              >
                                <TableCell className="py-2 border-e border-border ps-5">
                                  {payment.installment}
                                </TableCell>
                                <TableCell className="py-2 border-e border-border">
                                  {payment.receiver}
                                </TableCell>
                                <TableCell className="py-2 border-e border-border text-right pe-3">
                                  {payment.amount}
                                </TableCell>
                                <TableCell className="py-2 border-e border-border text-right pe-3">
                                  ฿
                                  {payment.remainingInterest.toLocaleString(
                                    'th-TH',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </TableCell>
                                <TableCell className="py-2 border-e border-border">
                                  {payment.dueDate}
                                </TableCell>
                                <TableCell className="py-2 border-e border-border">
                                  {payment.paidDate}
                                </TableCell>
                                <TableCell className="py-2 border-e border-border">
                                  <Badge
                                    variant={
                                      payment.status === 'ชำระแล้ว'
                                        ? 'success'
                                        : payment.isLate
                                          ? 'destructive'
                                          : 'warning'
                                    }
                                    appearance="light"
                                    size="sm"
                                  >
                                    {payment.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center py-2">
                                  {!payment.isPaid && (
                                    <Button
                                      variant="mono"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedInstallment(payment);
                                        setIsPaymentDialogOpen(true);
                                      }}
                                    >
                                      ชำระสินเชื่อ
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ),
                          )
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              {isLoading ? (
                                <span className="text-muted-foreground">
                                  กำลังโหลดข้อมูล...
                                </span>
                              ) : (
                                <div className="flex flex-col items-center gap-3">
                                  <p className="text-muted-foreground">
                                    ยังไม่มีข้อมูลตารางผ่อนชำระ
                                  </p>
                                  {/* {loan && (
                                    <Button
                                      variant="mono"
                                      onClick={() => {
                                        if (loanId) {
                                          generateInstallments.mutate(loanId);
                                        }
                                      }}
                                      disabled={generateInstallments.isPending}
                                    >
                                      {generateInstallments.isPending
                                        ? 'กำลังสร้าง...'
                                        : 'สร้างตารางผ่อนชำระ'}
                                    </Button>
                                  )} */}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="cancel" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex flex-col items-center justify-center h-full px-3.5 py-10 gap-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      ยกเลิกสินเชื่อ
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                      การยกเลิกสินเชื่อจะเปลี่ยนสถานะเป็น "ยกเลิก"
                      และไม่สามารถกู้คืนได้ กรุณายืนยันการดำเนินการ
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleDelete}
                    disabled={deleteLoan.isPending}
                    className="min-w-[200px]"
                  >
                    {deleteLoan.isPending
                      ? 'กำลังยกเลิก...'
                      : 'ยืนยันยกเลิกสินเชื่อ'}
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="valuation" className="mt-0 flex-1">
              <ScrollArea
                className="flex flex-col h-[calc(100dvh-21.5rem)] mx-1.5"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="px-3.5 py-5 relative">
                  {/* Loading Overlay */}
                  {isValuating && (
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
                      <div className="flex flex-col items-center space-y-6 text-center px-6 py-8">
                        {/* AI Loading Animation */}
                        <Image
                          src="/images/logo.png"
                          alt="InfiniteX Logo"
                          width={50}
                          height={50}
                          className="w-50 h-50 object-contain animate-pulse"
                          priority
                        />
                        {/* Title */}
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold gradientText">
                            AI กำลังประเมินมูลค่าทรัพย์สิน
                          </h3>
                          <hr />
                          <p className="text-sm text-muted-foreground">
                            กำลังวิเคราะห์ข้อมูลโฉนดและรูปภาพ กรุณารอสักครู่...
                          </p>
                        </div>

                        {/* Animated Steps */}
                        <div className="text-xs text-muted-foreground space-y-2 text-left w-full max-w-xs">
                          <div className="flex items-center animate-pulse">
                            <div className="h-2 w-2 mr-2 bg-primary rounded-full animate-bounce" />
                            <span>วิเคราะห์ข้อมูลโฉนดที่ดิน</span>
                          </div>
                          <div className="flex items-center animate-pulse delay-75">
                            <div
                              className="h-2 w-2 mr-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '0.1s' }}
                            />
                            <span>ตรวจสอบรูปภาพประกอบ</span>
                          </div>
                          <div className="flex items-center animate-pulse delay-150">
                            <div
                              className="h-2 w-2 mr-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '0.2s' }}
                            />
                            <span>คำนวณมูลค่าทรัพย์สิน</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {valuationResult ? (
                    <div className="space-y-5">
                      {/* Valuation Result Display */}

                      {/* Summary Section */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            มูลค่าประเมิน
                          </Label>
                          <p className="text-2xl font-bold text-foreground">
                            ฿
                            {Number(
                              valuationResult.estimatedValue ||
                                valuationResult.propertyValue ||
                                0,
                            ).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            ความมั่นใจ
                          </Label>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-semibold text-foreground">
                              {valuationResult.confidence
                                ? `${valuationResult.confidence.toFixed(0)}%`
                                : '-'}
                            </p>
                            {valuationResult.confidence && (
                              <Badge
                                variant={
                                  valuationResult.confidence / 100 >= 0.7
                                    ? 'success'
                                    : valuationResult.confidence / 100 >= 0.5
                                      ? 'warning'
                                      : 'destructive'
                                }
                                appearance="light"
                                size="sm"
                              >
                                {valuationResult.confidence / 100 >= 0.7
                                  ? 'สูง'
                                  : valuationResult.confidence / 100 >= 0.5
                                    ? 'ปานกลาง'
                                    : 'ต่ำ'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            วันที่ประเมิน
                          </Label>
                          <p className="text-base font-medium text-foreground">
                            {loan?.valuationDate
                              ? new Date(loan.valuationDate).toLocaleDateString(
                                  'th-TH',
                                  {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  },
                                )
                              : new Date().toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                          </p>
                        </div>
                      </div>

                      {/* Reasoning Section */}
                      {valuationResult.reasoning && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground font-semibold">
                            เหตุผลการประเมิน
                          </Label>
                          <div className="p-4 bg-muted/50 rounded-md border border-border">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {valuationResult.reasoning}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Analysis Section */}
                      {valuationResult.analysis && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground font-semibold">
                            การวิเคราะห์เพิ่มเติม
                          </Label>
                          <div className="p-4 bg-muted/50 rounded-md border border-border">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {valuationResult.analysis}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Details Section */}
                      {valuationResult.details && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground font-semibold">
                            รายละเอียดเพิ่มเติม
                          </Label>
                          <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-md border border-border">
                            {Object.entries(valuationResult.details).map(
                              ([key, value]: [string, any]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-sm text-muted-foreground">
                                    {key}:
                                  </span>
                                  <span className="text-sm font-medium text-foreground">
                                    {value}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      <hr />
                      <div className="justify-center flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleValuation}
                          disabled={isValuating}
                        >
                          {isValuating ? 'กำลังประเมิน...' : 'ประเมินอีกครั้ง'}
                        </Button>
                        <Button
                          variant="mono"
                          size="sm"
                          onClick={handleSaveValuation}
                          disabled={isSavingValuation}
                          className="gradientButton"
                        >
                          {isSavingValuation
                            ? 'กำลังบันทึก...'
                            : 'บันทึกผลประเมิน'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-6">
                      <div className="text-center space-y-4">
                        <h3 className="text-xl font-semibold text-foreground">
                          ยังไม่มีการประเมินมูลค่าทรัพย์สิน
                        </h3>
                        เงื่อนไขการใช้งาน
                        <hr className="my-2" />
                        <p className="text-muted-foreground max-w-md gradientText">
                          * ต้องมีผลวิเคราะห์จาก AI <br />* หรือ
                          ต้องมีรูปโฉนดที่ดินกับภาพประกอบ
                        </p>
                      </div>
                      <Button
                        variant="mono"
                        size="lg"
                        onClick={handleValuation}
                        disabled={isValuating}
                        className="gradientButton min-w-[200px]"
                      >
                        {isValuating
                          ? 'กำลังประเมิน...'
                          : 'ประเมินมูลค่าทรัพย์สิน'}
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0">
          {/* <Button variant="ghost">พิมพ์เอกสาร</Button> */}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteLoan.isPending}
          >
            {deleteLoan.isPending ? 'กำลังลบ...' : 'ลบ'}
          </Button>
          <Button
            variant="mono"
            className="gradientButton"
            onClick={() => {
              onOpenChange(false);
              onEdit?.();
            }}
          >
            แก้ไขข้อมูล
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader className="flex flex-col items-center gap-4 pb-4">
            <div className="flex justify-center">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            <DialogTitle className="text-center text-xl gradientText">
              ชำระเงิน
            </DialogTitle>
            <hr className="w-full border-border" />
          </DialogHeader>

          <Tabs value={paymentTab} onValueChange={setPaymentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="partial">ชำระยอดผู้กู้</TabsTrigger>
              <TabsTrigger value="full">ปิดสินเชื่อ</TabsTrigger>
            </TabsList>

            <TabsContent value="partial" className="space-y-6 pt-4">
              {selectedInstallment && (
                <>
                  {/* รายละเอียดผู้กู้ */}
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-[#B8860B]">
                      รายละเอียดผู้กู้
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="borrower">
                          ผู้กู้ <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="borrower"
                          value={
                            loan ? loan.customer?.profile?.fullName || '-' : '-'
                          }
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="receiver">
                          ผู้รับชำระ <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="receiver"
                          value={paymentForm.receiver}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              receiver: e.target.value,
                            })
                          }
                          placeholder="ระบุผู้รับชำระ"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="installment">งวดที่</Label>
                        <Input
                          id="installment"
                          value={selectedInstallment.installment || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">
                          ยอดต้นชำระ <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="amount"
                            type="text"
                            value={
                              selectedInstallment.totalAmount?.toLocaleString() ||
                              '0'
                            }
                            disabled
                            className="bg-muted pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">
                          ช่องทางการชำระ{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={paymentForm.paymentMethod}
                          onValueChange={(value) =>
                            setPaymentForm({
                              ...paymentForm,
                              paymentMethod: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกการชำระ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">💰 เงินสด</SelectItem>
                            {/* <SelectItem value="QR_CODE">QR Code</SelectItem> */}
                            {/* <SelectItem value="BARCODE">Barcode</SelectItem> */}
                            <SelectItem value="INTERNET_BANKING">
                              💳 Internet Banking
                            </SelectItem>
                            <SelectItem value="BANK_TRANSFER">
                              ⛪ โอนเงินผ่านธนาคาร
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landAccount">
                          บัญชีรับชำระ{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={paymentForm.landAccountId}
                          onValueChange={(value) =>
                            setPaymentForm({
                              ...paymentForm,
                              landAccountId: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกบัญชี" />
                          </SelectTrigger>
                          <SelectContent>
                            {landAccountsData?.data?.map((account: any) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName} (฿
                                {Number(account.accountBalance).toLocaleString(
                                  'th-TH',
                                  {
                                    minimumFractionDigits: 2,
                                  },
                                )}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentDate">วันที่ชำระ</Label>
                        <Input
                          id="paymentDate"
                          type="date"
                          value={paymentForm.paymentDate}
                          onChange={(e) =>
                            setPaymentForm({
                              ...paymentForm,
                              paymentDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลการคำนวนรายการสินเชื่อ */}
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-[#B8860B]">
                      ข้อมูลการคำนวนรายการสินเชื่อ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="systemAmount">
                          ยอดต้นชำระ-ระบบทั้งสิ้น
                        </Label>
                        <div className="relative">
                          <Input
                            id="systemAmount"
                            type="text"
                            value={
                              selectedInstallment.totalAmount?.toLocaleString() ||
                              '0'
                            }
                            disabled
                            className="bg-muted pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalLoan">ยอดสินเชื่อรวม</Label>
                        <div className="relative">
                          <Input
                            id="totalLoan"
                            type="text"
                            value={Number(
                              loan?.remainingBalance || 0,
                            ).toLocaleString()}
                            disabled
                            className="bg-muted pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end">
                    <Button
                      variant="mono"
                      className="w-full gradientButton"
                      onClick={() => {
                        if (!loanId || !selectedInstallment) {
                          alert('กรุณาเลือกงวดที่ต้องการชำระ');
                          return;
                        }

                        // Validate required fields
                        if (!paymentForm.paymentMethod) {
                          alert('กรุณาเลือกช่องทางการชำระเงิน');
                          return;
                        }

                        if (!paymentForm.receiver) {
                          alert('กรุณาระบุผู้รับชำระ');
                          return;
                        }

                        if (!paymentForm.landAccountId) {
                          alert('กรุณาเลือกบัญชีรับชำระ');
                          return;
                        }

                        // Submit installment payment
                        if (paymentTab === 'partial') {
                          payInstallment.mutate(
                            {
                              loanId: loanId,
                              installmentId: selectedInstallment.id,
                              amount: selectedInstallment.totalAmount,
                              paymentMethod: paymentForm.paymentMethod as any,
                              landAccountId: paymentForm.landAccountId,
                              includeLateFee: true,
                            },
                            {
                              onSuccess: () => {
                                setIsPaymentDialogOpen(false);
                                // Reset form
                                setPaymentForm({
                                  installmentNumber: '',
                                  paymentAmount: '',
                                  paymentDate: new Date()
                                    .toISOString()
                                    .split('T')[0],
                                  paymentMethod: '',
                                  receiver: '',
                                  landAccountId: '',
                                });
                                setSelectedInstallment(null);
                              },
                            },
                          );
                        }
                      }}
                      disabled={payInstallment.isPending}
                    >
                      {payInstallment.isPending
                        ? 'กำลังดำเนินการ...'
                        : 'ยืนยัน'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="full" className="space-y-6 pt-4">
              {loan && (
                <>
                  {/* รายละเอียดผู้กู้ */}
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-[#B8860B]">
                      รายละเอียดผู้กู้
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="closeBorrower">
                          ผู้กู้ <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="closeBorrower"
                          value={loan.customer?.profile?.fullName || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closeReceiver">
                          ผู้รับชำระ <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="closeReceiver"
                          value={closeLoanForm.receiver}
                          onChange={(e) =>
                            setCloseLoanForm({
                              ...closeLoanForm,
                              receiver: e.target.value,
                            })
                          }
                          placeholder="ระบุผู้รับชำระ"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="closeTotalAmount">
                          ยอดชำระทั้งหมด{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="closeTotalAmount"
                            type="text"
                            value={Number(
                              loan.remainingBalance || 0,
                            ).toLocaleString()}
                            disabled
                            className="bg-muted pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closePaymentMethod">
                          ช่องทางการชำระ{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={closeLoanForm.paymentMethod}
                          onValueChange={(value) =>
                            setCloseLoanForm({
                              ...closeLoanForm,
                              paymentMethod: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกการชำระ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">💰 เงินสด</SelectItem>
                            {/* <SelectItem value="QR_CODE">QR Code</SelectItem> */}
                            {/* <SelectItem value="BARCODE">Barcode</SelectItem> */}
                            <SelectItem value="INTERNET_BANKING">
                              💳 Internet Banking
                            </SelectItem>
                            <SelectItem value="BANK_TRANSFER">
                              ⛪ โอนเงินผ่านธนาคาร
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closeLandAccount">
                          บัญชีรับชำระ{' '}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={closeLoanForm.landAccountId}
                          onValueChange={(value) =>
                            setCloseLoanForm({
                              ...closeLoanForm,
                              landAccountId: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกบัญชี" />
                          </SelectTrigger>
                          <SelectContent>
                            {landAccountsData?.data?.map((account: any) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.accountName} (฿
                                {Number(account.accountBalance).toLocaleString(
                                  'th-TH',
                                  {
                                    minimumFractionDigits: 2,
                                  },
                                )}
                                )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="closePaymentDate">วันที่ชำระ</Label>
                        <Input
                          id="closePaymentDate"
                          type="date"
                          value={closeLoanForm.paymentDate}
                          onChange={(e) =>
                            setCloseLoanForm({
                              ...closeLoanForm,
                              paymentDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลการคำนวนรายการสินเชื่อ */}
                  <div>
                    <h3 className="text-base font-semibold mb-4 text-[#B8860B]">
                      ข้อมูลการคำนวนรายการสินเชื่อ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="closeSystemAmount">
                          ยอดต้นชำระ-ระบบทั้งสิ้น
                        </Label>
                        <div className="relative">
                          <Input
                            id="closeSystemAmount"
                            type="text"
                            value={Number(
                              loan.remainingBalance || 0,
                            ).toLocaleString()}
                            disabled
                            className="bg-muted pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="closeInstallmentsRemaining">
                          งวดที่เหลือ
                        </Label>
                        <div className="relative">
                          <Input
                            id="closeInstallmentsRemaining"
                            type="text"
                            value={`${(loan.totalInstallments || 0) - (loan.currentInstallment || 0)} งวด`}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end">
                    <Button
                      variant="mono"
                      className="w-full gradientButton"
                      onClick={() => {
                        if (!loanId) {
                          alert('ไม่พบข้อมูลสินเชื่อ');
                          return;
                        }

                        // Validate required fields
                        if (!closeLoanForm.paymentMethod) {
                          alert('กรุณาเลือกช่องทางการชำระเงิน');
                          return;
                        }

                        if (!closeLoanForm.receiver) {
                          alert('กรุณาระบุผู้รับชำระ');
                          return;
                        }

                        if (!closeLoanForm.landAccountId) {
                          alert('กรุณาเลือกบัญชีรับชำระ');
                          return;
                        }

                        // Submit close loan payment
                        closeLoan.mutate(
                          {
                            loanId: loanId,
                            paymentMethod: closeLoanForm.paymentMethod as any,
                            landAccountId: closeLoanForm.landAccountId,
                            discountAmount: 0,
                            additionalFees: 0,
                            notes: `ปิดสินเชื่อ - รับชำระโดย ${closeLoanForm.receiver}`,
                          },
                          {
                            onSuccess: () => {
                              setIsPaymentDialogOpen(false);
                              // Reset form
                              setCloseLoanForm({
                                paymentDate: new Date()
                                  .toISOString()
                                  .split('T')[0],
                                paymentMethod: '',
                                receiver: '',
                                landAccountId: '',
                              });
                            },
                          },
                        );
                      }}
                      disabled={closeLoan.isPending}
                    >
                      {closeLoan.isPending ? 'กำลังดำเนินการ...' : 'บันทึก'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
