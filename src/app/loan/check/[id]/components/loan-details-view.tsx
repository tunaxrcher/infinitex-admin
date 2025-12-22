'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dices,
  Loader2,
  Save,
  Sparkles,
  TrendingUp,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
import { ScrollArea } from '@src/shared/components/ui/scroll-area';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@src/shared/components/ui/tabs';
import { Textarea } from '@src/shared/components/ui/textarea';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@src/shared/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@src/shared/components/ui/tooltip';

interface LoanDetailsViewProps {
  loanApplicationId: string;
  authToken: string | null;
  isLocked?: boolean;
}

interface ValuationResult {
  estimatedValue?: number;
  propertyValue?: number;
  reasoning?: string;
  analysis?: string;
  confidence?: number;
  details?: Record<string, any>;
}

interface LoanData {
  id: string;
  status: string;
  loanType: string;
  requestedAmount: number;
  approvedAmount: number | null;
  maxApprovedAmount: number | null;
  interestRate: number;
  termMonths: number;
  operationFee: number;
  transferFee: number;
  otherFee: number;
  propertyType: string | null;
  propertyValue: number | null;
  propertyArea: string | null;
  propertyLocation: string | null;
  landNumber: string | null;
  ownerName: string | null;
  titleDeedImage: string | null;
  supportingImages: string[];
  idCardFrontImage: string | null;
  idCardBackImage: string | null;
  // AI Analysis fields
  valuationResult: ValuationResult | null;
  estimatedValue: number | null;
  valuationDate: string | null;
  customer: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    idCardNumber: string | null;
    address: string | null;
    email: string | null;
    idCardImage?: string | null;
  } | null;
  agent: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
  } | null;
  hasLoan: boolean;
  loan: {
    id: string;
    loanNumber: string;
    status: string;
  } | null;
  createdAt: string;
  submittedAt: string | null;
  reviewNotes: string | null;
}

interface LandAccount {
  id: string;
  accountName: string;
  accountBalance: number;
}

interface IdCardData {
  fullName?: string;
  idCardNumber?: string;
  address?: string;
  birthDate?: string;
  issueDate?: string;
  expiryDate?: string;
}

type ApprovalStep =
  | 'details'
  | 'approve-step1'
  | 'approve-step2'
  | 'reject'
  | 'success'
  | 'rejected';

export function LoanDetailsView({
  loanApplicationId,
  authToken,
  isLocked = false,
}: LoanDetailsViewProps) {
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [landAccounts, setLandAccounts] = useState<LandAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<ApprovalStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Approval form state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [editedLoanAmount, setEditedLoanAmount] = useState<number>(0);
  const [loanYears, setLoanYears] = useState(1);
  const [interestRate, setInterestRate] = useState(1);
  const [operationFee, setOperationFee] = useState(0);
  const [transferFee, setTransferFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [note, setNote] = useState('');

  // Reject form state
  const [rejectReason, setRejectReason] = useState('');

  // ID Card upload state
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [isAnalyzingIdCard, setIsAnalyzingIdCard] = useState(false);
  const [idCardData, setIdCardData] = useState<IdCardData | null>(null);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isGeneratingPhone, setIsGeneratingPhone] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    fullName: '',
    idCardNumber: '',
    address: '',
    email: '',
    phoneNumber: '',
  });

  // Collect all images
  const allImages = useMemo(() => {
    const images: string[] = [];
    if (loanData?.titleDeedImage) images.push(loanData.titleDeedImage);
    if (loanData?.supportingImages?.length)
      images.push(...loanData.supportingImages);
    return images;
  }, [loanData]);

  // Fetch loan data - preview when locked, full data when authenticated
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Use preview endpoint when locked (no auth), full endpoint when authenticated
        const endpoint = authToken
          ? `/api/loan-check/${loanApplicationId}`
          : `/api/loan-check/${loanApplicationId}/preview`;

        const headers: HeadersInit = authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {};

        const loanResponse = await fetch(endpoint, { headers });
        const loanResult = await loanResponse.json();

        if (!loanResult.success) {
          throw new Error(loanResult.message);
        }

        setLoanData(loanResult.data);

        if (loanResult.data) {
          setEditedLoanAmount(loanResult.data.requestedAmount || 0);
          setInterestRate(loanResult.data.interestRate || 1);
          setLoanYears((loanResult.data.termMonths || 48) / 12);
          setOperationFee(loanResult.data.operationFee || 0);
          setTransferFee(loanResult.data.transferFee || 0);
          setOtherFee(loanResult.data.otherFee || 0);

          // Set customer form data
          if (loanResult.data.customer) {
            setCustomerFormData({
              fullName: loanResult.data.customer.fullName || '',
              idCardNumber: loanResult.data.customer.idCardNumber || '',
              address: loanResult.data.customer.address || '',
              email: loanResult.data.customer.email || '',
              phoneNumber: loanResult.data.customer.phoneNumber || '',
            });
          }
        }

        // Only fetch land accounts when authenticated (for approval form)
        if (authToken) {
          const accountsResponse = await fetch(
            '/api/loan-check/land-accounts',
            {
              headers: { Authorization: `Bearer ${authToken}` },
            },
          );
          const accountsResult = await accountsResponse.json();

          if (accountsResult.success) {
            setLandAccounts(accountsResult.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loanApplicationId, authToken]);

  // Calculations (ใช้สูตรเดียวกับ product-form-sheet.tsx)
  const loanAmount = editedLoanAmount || loanData?.requestedAmount || 0;
  const termMonths = loanYears * 12;

  // ยอดดอกเบี้ยรวม = ยอดสินเชื่อ × (ดอกเบี้ย/100) × จำนวนปี
  const totalInterest = useMemo(() => {
    return loanAmount * (interestRate / 100) * loanYears;
  }, [loanAmount, interestRate, loanYears]);

  // ยอดสินเชื่อรวม = ยอดสินเชื่อ + ยอดดอกเบี้ยรวม
  const totalLoanAmount = useMemo(() => {
    return loanAmount + totalInterest;
  }, [loanAmount, totalInterest]);

  // งวดละ (รายเดือน) = ดอกเบี้ยต่อเดือน (ไม่รวมเงินต้น)
  // สูตร: ยอดเงินกู้ × (อัตราดอกเบี้ยต่อปี / 100) / 12
  const monthlyPayment = useMemo(() => {
    if (loanAmount === 0 || interestRate === 0) return 0;
    const monthlyInterest = (loanAmount * (interestRate / 100)) / 12;
    return monthlyInterest;
  }, [loanAmount, interestRate]);

  // ยอดจ่ายจริง = ยอดสินเชื่อ - ค่าธรรมเนียมต่างๆ
  const actualPayment = useMemo(() => {
    return loanAmount - (operationFee + transferFee + otherFee);
  }, [loanAmount, operationFee, transferFee, otherFee]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleApprove = async () => {
    if (!selectedAccountId) {
      setError('กรุณาเลือกบัญชีสำหรับจ่ายสินเชื่อ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/loan-check/${loanApplicationId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            landAccountId: selectedAccountId,
            approvedAmount: editedLoanAmount,
            interestRate,
            termMonths,
            operationFee,
            transferFee,
            otherFee,
            note,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setCurrentStep('success');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/loan-check/${loanApplicationId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ reviewNotes: rejectReason }),
        },
      );

      const result = await response.json();

      if (result.success) {
        setCurrentStep('rejected');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle ID card upload
  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setIdCardPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze with AI
    setIsAnalyzingIdCard(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/customers/analyze-id-card', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        setIdCardData(result.data);
        // Auto-fill form
        setCustomerFormData((prev) => ({
          ...prev,
          fullName: result.data.fullName || prev.fullName,
          idCardNumber: result.data.idCardNumber || prev.idCardNumber,
          address: result.data.address || prev.address,
        }));
      } else {
        setError(result.message || 'ไม่สามารถอ่านข้อมูลจากบัตรประชาชนได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการวิเคราะห์บัตรประชาชน');
    } finally {
      setIsAnalyzingIdCard(false);
    }
  };

  // Save customer data
  const handleSaveCustomer = async () => {
    if (!loanData?.customer?.id) {
      setError('ไม่พบข้อมูลลูกค้า');
      return;
    }

    setIsSavingCustomer(true);
    try {
      const response = await fetch(
        `/api/loan-check/${loanApplicationId}/customer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            customerId: loanData.customer.id,
            ...customerFormData,
            idCardImage: idCardPreview,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        // Update local state
        setLoanData((prev) =>
          prev
            ? {
                ...prev,
                customer: {
                  ...prev.customer!,
                  ...customerFormData,
                },
              }
            : null,
        );
        setError('');
        alert('บันทึกข้อมูลลูกค้าสำเร็จ');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Generate random phone number
  const handleGeneratePhone = async () => {
    setIsGeneratingPhone(true);
    try {
      const response = await fetch('/api/customers/generate-phone', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate phone number');
      }

      const result = await response.json();

      if (result.success && result.data?.phoneNumber) {
        setCustomerFormData((prev) => ({
          ...prev,
          phoneNumber: result.data.phoneNumber,
        }));
      }
    } catch (error) {
      setError('ไม่สามารถสร้างเบอร์โทรศัพท์ได้');
    } finally {
      setIsGeneratingPhone(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant:
          | 'primary'
          | 'success'
          | 'warning'
          | 'destructive'
          | 'secondary';
        label: string;
      }
    > = {
      DRAFT: { variant: 'secondary', label: 'ร่าง' },
      SUBMITTED: { variant: 'primary', label: 'รอตรวจสอบ' },
      UNDER_REVIEW: { variant: 'warning', label: 'กำลังตรวจสอบ' },
      APPROVED: { variant: 'success', label: 'อนุมัติแล้ว' },
      REJECTED: { variant: 'destructive', label: 'ปฏิเสธแล้ว' },
      CANCELLED: { variant: 'secondary', label: 'ยกเลิกแล้ว' },
    };
    const config = statusConfig[status] || statusConfig.DRAFT;
    return (
      <Badge variant={config.variant} appearance="light">
        {config.label}
      </Badge>
    );
  };

  const getLoanTypeBadge = (loanType: string) => {
    return loanType === 'HOUSE_LAND_MORTGAGE' ? 'จำนองบ้านและที่ดิน' : 'เงินสด';
  };

  // Get AI analysis data
  const aiAnalysis = useMemo(() => {
    const val = loanData?.valuationResult;
    if (!val) return null;
    return {
      estimatedValue:
        val.estimatedValue ||
        val.propertyValue ||
        loanData?.estimatedValue ||
        0,
      reasoning: val.reasoning || val.analysis || '',
      confidence: val.confidence || 0,
    };
  }, [loanData]);

  // Show skeleton only when loading AND no data yet
  if (isLoading && !loanData) {
    return (
      <div className="min-h-screen w-full bg-background">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </header>

        {/* Tabs Skeleton */}
        <div className="max-w-7xl mx-auto border-b border-border px-5">
          <div className="flex items-center gap-4 py-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
          {/* Image Gallery Card Skeleton */}
          <Card className="rounded-md">
            <CardHeader className="min-h-[34px] bg-accent/50">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <Skeleton className="h-[250px] w-full lg:w-[350px] rounded-md" />
                <div className="flex-1 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-[40px] w-[40px] rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Loan Summary Card Skeleton */}
          <Card className="rounded-md">
            <CardHeader className="min-h-[34px] bg-accent/50">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-start flex-wrap lg:gap-10 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Card Skeleton */}
          <Card className="rounded-md border-primary/30">
            <CardHeader className="min-h-[34px] bg-primary/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Skeleton className="h-4 w-40" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>

          {/* Calculation Preview Skeleton */}
          <Card className="rounded-md">
            <CardHeader className="min-h-[34px] bg-accent/50">
              <Skeleton className="h-4 w-44" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-4 pb-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-28" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Action Bar Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-30">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !loanData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">อนุมัติสำเร็จ!</h2>
              <p className="text-muted-foreground mb-6">
                สินเชื่อได้รับการอนุมัติเรียบร้อยแล้ว
                <br />
                และได้แจ้งเตือนผ่าน LINE แล้ว
              </p>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 mb-6">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  ยอดสินเชื่อ: ฿{formatCurrency(loanAmount)}
                </p>
                <p className="text-green-600 dark:text-green-500 text-sm">
                  งวดละ: ฿{formatCurrency(monthlyPayment)}/เดือน
                </p>
              </div>
              <Button onClick={() => window.close()} className="w-full">
                ปิดหน้านี้
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Rejected screen
  if (currentStep === 'rejected') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">ปฏิเสธแล้ว</h2>
              <p className="text-muted-foreground mb-6">
                สินเชื่อได้ถูกปฏิเสธเรียบร้อยแล้ว
                <br />
                และได้แจ้งเตือนผ่าน LINE แล้ว
              </p>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 mb-6">
                <p className="text-destructive text-sm">
                  เหตุผล: {rejectReason}
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => window.close()}
                className="w-full"
              >
                ปิดหน้านี้
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const canApprove = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(
    loanData?.status || '',
  );

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="font-semibold text-foreground">ตรวจสอบสินเชื่อ</h1>
              <p className="text-xs text-muted-foreground">
                ID: {loanApplicationId.slice(0, 8)}...
              </p>
            </div>
          </div>
          {loanData && getStatusBadge(loanData.status)}
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Loan Details View */}
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col h-full"
              >
                <div className="border-b border-border px-5">
                  <TabsList className="h-auto p-0 bg-transparent border-b-0 border-border rounded-none w-full">
                    <div className="flex items-center gap-1 min-w-max overflow-x-auto">
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
                        value="customer"
                        className="relative text-foreground px-3 py-2.5 hover:text-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:font-medium"
                      >
                        ข้อมูลลูกค้า
                        {activeTab === 'customer' && (
                          <div className="absolute bottom-0 left-0 right-0 h-px bg-primary" />
                        )}
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </div>

                <TabsContent value="details" className="mt-0 flex-1">
                  <ScrollArea className="flex flex-col h-[calc(100dvh-10rem)] mx-1.5">
                    {isLoading ? (
                      <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                        <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                          <Card className="rounded-md">
                            <CardHeader className="min-h-[34px] bg-accent/50">
                              <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-start flex-wrap lg:gap-10 gap-5">
                                {[1, 2, 3, 4].map((i) => (
                                  <div
                                    key={i}
                                    className="flex flex-col gap-1.5"
                                  >
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-5 w-24" />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                        <div className="grow lg:border-e border-border lg:pe-5 space-y-5 py-5">
                          {/* Image Gallery - Moved to Top */}
                          <Card className="rounded-md">
                            <CardHeader className="min-h-[34px] bg-accent/50">
                              <CardTitle className="text-2sm">
                                รูปโฉนดและภาพเพิ่มเติม
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="flex flex-col lg:flex-row gap-4">
                                <div className="shrink-0">
                                  <Card className="flex items-center justify-center rounded-md bg-accent/50 shadow-none">
                                    {allImages.length > 0 ? (
                                      <img
                                        src={
                                          allImages[selectedImageIndex] ||
                                          '/images/loan.png'
                                        }
                                        className="h-[200px] lg:h-[250px] shrink-0 object-cover w-full lg:w-[350px] rounded-md"
                                        alt="รูปหลักประกัน/โฉนด"
                                      />
                                    ) : (
                                      <div className="h-[200px] lg:h-[250px] w-full lg:w-[350px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                          <Image
                                            src="/images/loan.png"
                                            alt="ไม่มีรูป"
                                            width={80}
                                            height={80}
                                            className="mx-auto mb-2 opacity-50"
                                          />
                                          <p className="text-sm">ไม่มีรูปภาพ</p>
                                        </div>
                                      </div>
                                    )}
                                  </Card>

                                  {allImages.length > 0 && (
                                    <ToggleGroup
                                      className="grid grid-cols-5 gap-2 mt-3"
                                      type="single"
                                      value={selectedImageIndex.toString()}
                                      onValueChange={(newValue) => {
                                        if (newValue)
                                          setSelectedImageIndex(
                                            parseInt(newValue),
                                          );
                                      }}
                                    >
                                      {allImages
                                        .slice(0, 5)
                                        .map((image, index) => (
                                          <ToggleGroupItem
                                            key={index}
                                            value={index.toString()}
                                            className="rounded-md border border-border shrink-0 h-[40px] p-0 bg-accent/50 hover:bg-accent/50 data-[state=on]:border-zinc-950 dark:data-[state=on]:border-zinc-50"
                                          >
                                            <img
                                              src={image || '/images/loan.png'}
                                              className="h-[40px] w-[40px] object-cover rounded-md"
                                              alt={`รูปที่ ${index + 1}`}
                                            />
                                          </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                  )}
                                </div>

                                {/* Property Details - Next to Images */}
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2sm text-muted-foreground min-w-[80px]">
                                      เลขโฉนด
                                    </span>
                                    <span className="text-2sm font-medium">
                                      {loanData?.landNumber || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2sm text-muted-foreground min-w-[80px]">
                                      เจ้าของ
                                    </span>
                                    <span className="text-2sm font-medium">
                                      {loanData?.ownerName || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2sm text-muted-foreground min-w-[80px]">
                                      ที่ตั้ง
                                    </span>
                                    <span className="text-2sm font-medium">
                                      {loanData?.propertyLocation || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2sm text-muted-foreground min-w-[80px]">
                                      พื้นที่
                                    </span>
                                    <span className="text-2sm font-medium">
                                      {loanData?.propertyArea || '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-2sm text-muted-foreground min-w-[80px]">
                                      มูลค่าประเมิน
                                    </span>
                                    <span className="text-2sm font-medium">
                                      {loanData?.propertyValue
                                        ? `฿${formatCurrency(loanData.propertyValue)}`
                                        : '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Loan Summary - Without Status */}
                          <Card className="rounded-md">
                            <CardHeader className="min-h-[34px] bg-accent/50">
                              <CardTitle className="text-2sm">
                                สรุปคำขอสินเชื่อ
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-start flex-wrap lg:gap-10 gap-5">
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-2sm font-normal text-secondary-foreground">
                                    วงเงินที่ขอ
                                  </span>
                                  <span className="text-2sm font-medium text-foreground">
                                    ฿
                                    {loanData
                                      ? formatCurrency(loanData.requestedAmount)
                                      : '0'}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-2sm font-normal text-secondary-foreground">
                                    ระยะเวลา
                                  </span>
                                  <span className="text-2sm font-medium text-foreground">
                                    {loanData
                                      ? `${loanData.termMonths / 12} ปี (${loanData.termMonths} งวด)`
                                      : '-'}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-2sm font-normal text-secondary-foreground">
                                    ดอกเบี้ย
                                  </span>
                                  <span className="text-2sm font-medium text-foreground">
                                    <Badge variant="primary" appearance="light">
                                      {loanData
                                        ? Number(loanData.interestRate).toFixed(
                                            2,
                                          )
                                        : '0'}
                                      % ต่อปี
                                    </Badge>
                                  </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  <span className="text-2sm font-normal text-secondary-foreground">
                                    ประเภท
                                  </span>
                                  <span className="text-2sm font-medium text-foreground">
                                    {loanData
                                      ? getLoanTypeBadge(loanData.loanType)
                                      : '-'}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* AI Analysis Section */}
                          {aiAnalysis && (
                            <Card className="rounded-md border-primary/30">
                              <CardHeader className="min-h-[34px] bg-primary/10">
                                <CardTitle className="text-2sm flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  ผลการวิเคราะห์จาก AI
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-2sm text-muted-foreground">
                                      มูลค่าประเมิน
                                    </span>
                                    <p className="text-xl font-bold text-primary">
                                      ฿
                                      {formatCurrency(
                                        aiAnalysis.estimatedValue,
                                      )}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-2sm text-muted-foreground">
                                      ความมั่นใจ
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xl font-bold">
                                        {aiAnalysis.confidence > 0
                                          ? `${aiAnalysis.confidence.toFixed(0)}%`
                                          : '-'}
                                      </p>
                                      {aiAnalysis.confidence > 0 && (
                                        <Badge
                                          variant={
                                            aiAnalysis.confidence >= 70
                                              ? 'success'
                                              : aiAnalysis.confidence >= 50
                                                ? 'warning'
                                                : 'destructive'
                                          }
                                          appearance="light"
                                          size="sm"
                                        >
                                          {aiAnalysis.confidence >= 70
                                            ? 'สูง'
                                            : aiAnalysis.confidence >= 50
                                              ? 'ปานกลาง'
                                              : 'ต่ำ'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {aiAnalysis.reasoning && (
                                  <div className="space-y-2">
                                    <span className="text-2sm text-muted-foreground font-medium">
                                      เหตุผลการวิเคราะห์
                                    </span>
                                    <div className="p-3 bg-muted/50 rounded-md border border-border">
                                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                        {aiAnalysis.reasoning}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Loan Calculation Preview */}
                          {/* <Card className="rounded-md">
                            <CardHeader className="min-h-[34px] bg-accent/50">
                              <CardTitle className="text-2sm">
                                การคำนวณสินเชื่อ (Preview)
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-4 pb-5">
                              <div className="space-y-1">
                                <div className="text-2sm font-normal text-secondary-foreground">
                                  ยอดดอกเบี้ยรวม
                                </div>
                                <div className="text-lg font-semibold text-foreground">
                                  ฿{formatCurrency(totalInterest)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-2sm font-normal text-secondary-foreground">
                                  ยอดสินเชื่อรวม
                                </div>
                                <div className="text-lg font-semibold text-foreground">
                                  ฿{formatCurrency(totalLoanAmount)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-2sm font-normal text-secondary-foreground">
                                  งวดละ (รายเดือน)
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-lg font-semibold text-primary">
                                    ฿{formatCurrency(monthlyPayment)}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-2sm font-normal text-secondary-foreground">
                                  ยอดจ่ายจริง
                                </div>
                                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                  ฿{formatCurrency(actualPayment)}
                                </span>
                              </div>
                            </CardContent>
                          </Card> */}

                          {/* Review Notes */}
                          {loanData?.reviewNotes && (
                            <Card className="rounded-md border-warning">
                              <CardHeader className="min-h-[34px] bg-warning/10">
                                <CardTitle className="text-2sm flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-warning" />
                                  หมายเหตุ
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">
                                  {loanData.reviewNotes}
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="customer" className="mt-0 flex-1">
                  <ScrollArea className="flex flex-col h-[calc(100dvh-10rem)] mx-1.5">
                    <div className="px-3.5 py-5 max-w-2xl space-y-5">
                      {/* ID Card Upload */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <CardTitle className="text-2sm flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            อัพโหลดบัตรประชาชน
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <input
                            ref={idCardInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleIdCardUpload}
                            className="hidden"
                          />

                          <div className="flex flex-col lg:flex-row gap-4">
                            {/* Upload Area */}
                            <div
                              onClick={() => idCardInputRef.current?.click()}
                              className="flex-1 border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors min-h-[150px]"
                            >
                              {idCardPreview ? (
                                <img
                                  src={idCardPreview}
                                  alt="บัตรประชาชน"
                                  className="max-h-[140px] object-contain rounded"
                                />
                              ) : loanData?.idCardFrontImage ? (
                                <img
                                  src={loanData.idCardFrontImage}
                                  alt="บัตรประชาชน"
                                  className="max-h-[140px] object-contain rounded"
                                />
                              ) : (
                                <>
                                  <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                                  <p className="text-sm text-muted-foreground text-center">
                                    คลิกเพื่ออัพโหลดรูปบัตรประชาชน
                                  </p>
                                </>
                              )}
                            </div>

                            {/* AI Analysis Result */}
                            {isAnalyzingIdCard && (
                              <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">
                                    AI กำลังอ่านบัตร...
                                  </p>
                                </div>
                              </div>
                            )}

                            {idCardData && !isAnalyzingIdCard && (
                              <div className="flex-1 space-y-2 bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    อ่านบัตรสำเร็จ
                                  </span>
                                </div>
                                {idCardData.fullName && (
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">
                                      ชื่อ:
                                    </span>{' '}
                                    {idCardData.fullName}
                                  </p>
                                )}
                                {idCardData.idCardNumber && (
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">
                                      เลขบัตร:
                                    </span>{' '}
                                    {idCardData.idCardNumber}
                                  </p>
                                )}
                                {idCardData.address && (
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">
                                      ที่อยู่:
                                    </span>{' '}
                                    {idCardData.address}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Customer Info Form */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <CardTitle className="text-2sm">
                            ข้อมูลผู้กู้
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>ชื่อ-นามสกุล</Label>
                              <Input
                                value={customerFormData.fullName}
                                onChange={(e) =>
                                  setCustomerFormData((prev) => ({
                                    ...prev,
                                    fullName: e.target.value,
                                  }))
                                }
                                placeholder="ชื่อ-นามสกุล"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>เลขบัตรประชาชน</Label>
                              <Input
                                value={customerFormData.idCardNumber}
                                onChange={(e) =>
                                  setCustomerFormData((prev) => ({
                                    ...prev,
                                    idCardNumber: e.target.value,
                                  }))
                                }
                                placeholder="เลขบัตรประชาชน 13 หลัก"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>เบอร์โทรศัพท์</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={customerFormData.phoneNumber}
                                  onChange={(e) =>
                                    setCustomerFormData((prev) => ({
                                      ...prev,
                                      phoneNumber: e.target.value,
                                    }))
                                  }
                                  placeholder="เบอร์โทรศัพท์"
                                  className="flex-1"
                                />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleGeneratePhone}
                                        disabled={isGeneratingPhone}
                                      >
                                        {isGeneratingPhone ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Dices className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>สุ่มเบอร์อัตโนมัติ</p>
                                      <p className="text-xs text-muted-foreground">
                                        สำหรับลูกค้าที่ไม่ยอมให้เบอร์
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>ที่อยู่</Label>
                            <Textarea
                              value={customerFormData.address}
                              onChange={(e) =>
                                setCustomerFormData((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              placeholder="ที่อยู่"
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end pt-2">
                            <Button
                              onClick={handleSaveCustomer}
                              disabled={isSavingCustomer}
                            >
                              {isSavingCustomer ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  กำลังบันทึก...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  บันทึกข้อมูลลูกค้า
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Agent Info */}
                      {loanData?.agent && (
                        <Card className="rounded-md">
                          <CardHeader className="min-h-[34px] bg-accent/50">
                            <CardTitle className="text-2sm">
                              ข้อมูลตัวแทน
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center lg:gap-13 gap-5">
                              <div className="text-2sm text-secondary-foreground font-normal min-w-[120px]">
                                ชื่อ-นามสกุล
                              </div>
                              <div className="text-2sm text-foreground font-medium">
                                {loanData.agent.fullName || '-'}
                              </div>
                            </div>
                            <div className="flex items-center lg:gap-13 gap-5">
                              <div className="text-2sm text-secondary-foreground font-normal min-w-[120px]">
                                เบอร์โทรศัพท์
                              </div>
                              <div className="text-2sm text-foreground font-medium">
                                {loanData.agent.phoneNumber || '-'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Application Meta */}
                      <Card className="rounded-md">
                        <CardHeader className="min-h-[34px] bg-accent/50">
                          <CardTitle className="text-2sm">ข้อมูลคำขอ</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center lg:gap-13 gap-5">
                            <div className="text-2sm text-secondary-foreground font-normal min-w-[120px]">
                              วันที่สร้าง
                            </div>
                            <div className="text-2sm text-foreground font-medium">
                              {loanData?.createdAt
                                ? new Date(
                                    loanData.createdAt,
                                  ).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </div>
                          </div>
                          <div className="flex items-center lg:gap-13 gap-5">
                            <div className="text-2sm text-secondary-foreground font-normal min-w-[120px]">
                              วันที่ส่ง
                            </div>
                            <div className="text-2sm text-foreground font-medium">
                              {loanData?.submittedAt
                                ? new Date(
                                    loanData.submittedAt,
                                  ).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {/* Approve Step 1: Select Account */}
          {currentStep === 'approve-step1' && (
            <motion.div
              key="approve-step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader className="min-h-[34px] bg-accent/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      1
                    </div>
                    <CardTitle className="text-base">
                      เลือกบัญชีสำหรับจ่ายสินเชื่อ
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {landAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedAccountId === account.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30 bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2
                            className={`w-5 h-5 ${
                              selectedAccountId === account.id
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                          <div>
                            <p
                              className={`font-medium ${selectedAccountId === account.id ? 'text-primary' : ''}`}
                            >
                              {account.accountName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ยอดคงเหลือ: ฿
                              {formatCurrency(account.accountBalance)}
                            </p>
                          </div>
                        </div>
                        {selectedAccountId === account.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}

                  {landAccounts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>ไม่พบบัญชีที่สามารถใช้ได้</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Approve Step 2: Loan Calculation */}
          {currentStep === 'approve-step2' && (
            <motion.div
              key="approve-step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 max-w-2xl mx-auto space-y-4"
            >
              <Card>
                <CardHeader className="min-h-[34px] bg-accent/50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      2
                    </div>
                    <CardTitle className="text-base">
                      ข้อมูลการคำนวณรายการสินเชื่อ
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ยอดที่ขอมา (แสดงเสมอ) */}
                  <div className="space-y-2">
                    <Label variant="secondary">ยอดที่ขอมา</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={
                          loanData?.requestedAmount
                            ? formatCurrency(loanData.requestedAmount)
                            : '0.00'
                        }
                        disabled
                        className="pr-12 bg-muted"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        บาท
                      </span>
                    </div>
                  </div>

                  {/* ยอดที่อนุมัติ (แก้ไขได้) */}
                  <div className="space-y-2">
                    <Label>
                      ยอดที่อนุมัติ <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={editedLoanAmount || ''}
                        onChange={(e) =>
                          setEditedLoanAmount(parseFloat(e.target.value) || 0)
                        }
                        min={0}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        บาท
                      </span>
                    </div>
                    {loanData?.requestedAmount &&
                      editedLoanAmount !== loanData.requestedAmount && (
                        <p className="text-xs text-warning">
                          ⚠️ ยอดอนุมัติต่างจากยอดที่ขอ (
                          {editedLoanAmount > loanData.requestedAmount
                            ? '+'
                            : ''}
                          {formatCurrency(
                            editedLoanAmount - loanData.requestedAmount,
                          )}
                          )
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      จำนวนปี <span className="text-destructive">*</span>
                    </Label>
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

                  <div className="space-y-2">
                    <Label>
                      ดอกเบี้ย/ปี <span className="text-destructive">*</span>
                    </Label>
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

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label variant="secondary">ยอดดอกเบี้ยรวม</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatCurrency(totalInterest)}
                          disabled
                          className="pr-12 bg-muted"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          บาท
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label variant="secondary">ยอดสินเชื่อรวม</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatCurrency(totalLoanAmount)}
                          disabled
                          className="pr-12 bg-muted"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label variant="secondary">งวดละ (รายเดือน)</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={formatCurrency(monthlyPayment)}
                        disabled
                        className="pr-16 bg-primary/10 font-bold text-primary"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        บาท/เดือน
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ค่าดำเนินการ</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={operationFee || ''}
                            onChange={(e) =>
                              setOperationFee(parseFloat(e.target.value) || 0)
                            }
                            min={0}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ค่าโอน</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={transferFee || ''}
                            onChange={(e) =>
                              setTransferFee(parseFloat(e.target.value) || 0)
                            }
                            min={0}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            บาท
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>ค่าใช้จ่ายอื่น ๆ</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={otherFee || ''}
                          onChange={(e) =>
                            setOtherFee(parseFloat(e.target.value) || 0)
                          }
                          min={0}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          บาท
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label variant="secondary">ยอดจ่ายจริง</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          value={formatCurrency(actualPayment)}
                          disabled
                          className="pr-12 bg-green-50 dark:bg-green-950 font-bold text-green-700 dark:text-green-400"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          บาท
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <Label>หมายเหตุ</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="กรอกหมายเหตุเพิ่มเติม"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="py-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-primary-foreground/70 text-xs mb-1">
                        ยอดสินเชื่อรวม
                      </p>
                      <p className="font-bold">
                        ฿{formatCurrency(totalLoanAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/70 text-xs mb-1">
                        งวดละ
                      </p>
                      <p className="font-bold text-yellow-300">
                        ฿{formatCurrency(monthlyPayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/70 text-xs mb-1">
                        ยอดจ่ายจริง
                      </p>
                      <p className="font-bold text-green-300">
                        ฿{formatCurrency(actualPayment)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Reject Form */}
          {currentStep === 'reject' && (
            <motion.div
              key="reject"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="p-4 max-w-2xl mx-auto"
            >
              <Card>
                <CardHeader className="min-h-[34px] bg-destructive/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <CardTitle className="text-base">ปฏิเสธสินเชื่อ</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>
                    เหตุผลในการปฏิเสธ{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="กรุณาระบุเหตุผลในการปฏิเสธสินเชื่อ"
                    rows={4}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        <AnimatePresence>
          {error && loanData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-24 left-4 right-4 max-w-2xl mx-auto z-50"
            >
              <Card className="bg-destructive text-destructive-foreground">
                <CardContent className="py-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm flex-1">{error}</p>
                  <button onClick={() => setError('')}>
                    <X className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar */}
      {canApprove && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
          <div className="max-w-2xl mx-auto">
            {currentStep === 'details' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep('reject')}
                >
                  <X className="w-4 h-4 mr-2" />
                  ปฏิเสธ
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setCurrentStep('approve-step1')}
                >
                  <Check className="w-4 h-4 mr-2" />
                  อนุมัติ
                </Button>
              </div>
            )}

            {currentStep === 'approve-step1' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('details')}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  ย้อนกลับ
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!selectedAccountId) {
                      setError('กรุณาเลือกบัญชี');
                      return;
                    }
                    setError('');
                    setCurrentStep('approve-step2');
                  }}
                  disabled={!selectedAccountId}
                >
                  ถัดไป
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {currentStep === 'approve-step2' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('approve-step1')}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  ย้อนกลับ
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังอนุมัติ...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      ยืนยันอนุมัติ
                    </>
                  )}
                </Button>
              </div>
            )}

            {currentStep === 'reject' && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('details');
                    setRejectReason('');
                  }}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  ย้อนกลับ
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectReason.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      กำลังปฏิเสธ...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      ยืนยันปฏิเสธ
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Already processed message */}
      {!canApprove && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground">
              สินเชื่อนี้ได้รับการดำเนินการแล้ว
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
