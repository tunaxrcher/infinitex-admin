'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  User,
  FileText,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Building2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ImageIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@src/shared/components/ui/card';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
import { Textarea } from '@src/shared/components/ui/textarea';
import { Badge } from '@src/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';

interface LoanDetailsViewProps {
  loanApplicationId: string;
  authToken: string;
}

interface LoanData {
  id: string;
  status: string;
  loanType: string;
  requestedAmount: number;
  approvedAmount: number | null;
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
  customer: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    idCardNumber: string | null;
    address: string | null;
    email: string | null;
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

type ApprovalStep = 'details' | 'approve-step1' | 'approve-step2' | 'reject' | 'success' | 'rejected';

export function LoanDetailsView({ loanApplicationId, authToken }: LoanDetailsViewProps) {
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [landAccounts, setLandAccounts] = useState<LandAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<ApprovalStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approval form state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loanYears, setLoanYears] = useState(1);
  const [interestRate, setInterestRate] = useState(1);
  const [operationFee, setOperationFee] = useState(0);
  const [transferFee, setTransferFee] = useState(0);
  const [otherFee, setOtherFee] = useState(0);
  const [note, setNote] = useState('');

  // Reject form state
  const [rejectReason, setRejectReason] = useState('');

  // Fetch loan data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        const loanResponse = await fetch(`/api/loan-check/${loanApplicationId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const loanResult = await loanResponse.json();
        
        if (!loanResult.success) {
          throw new Error(loanResult.message);
        }
        
        setLoanData(loanResult.data);
        
        if (loanResult.data) {
          setInterestRate(loanResult.data.interestRate || 1);
          setLoanYears((loanResult.data.termMonths || 48) / 12);
          setOperationFee(loanResult.data.operationFee || 0);
          setTransferFee(loanResult.data.transferFee || 0);
          setOtherFee(loanResult.data.otherFee || 0);
        }

        const accountsResponse = await fetch('/api/loan-check/land-accounts', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const accountsResult = await accountsResponse.json();
        
        if (accountsResult.success) {
          setLandAccounts(accountsResult.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loanApplicationId, authToken]);

  // Calculations
  const loanAmount = loanData?.requestedAmount || 0;
  const termMonths = loanYears * 12;
  const totalInterest = useMemo(() => {
    return (loanAmount * interestRate * loanYears) / 100;
  }, [loanAmount, interestRate, loanYears]);
  
  const totalLoanAmount = useMemo(() => {
    return loanAmount + totalInterest;
  }, [loanAmount, totalInterest]);
  
  const monthlyPayment = useMemo(() => {
    if (termMonths === 0) return 0;
    return totalLoanAmount / termMonths;
  }, [totalLoanAmount, termMonths]);
  
  const actualPayment = useMemo(() => {
    return loanAmount - operationFee - transferFee - otherFee;
  }, [loanAmount, operationFee, transferFee, otherFee]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleApprove = async () => {
    if (!selectedAccountId) {
      setError('กรุณาเลือกบัญชีสำหรับจ่ายสินเชื่อ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/loan-check/${loanApplicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          landAccountId: selectedAccountId,
          interestRate,
          termMonths,
          operationFee,
          transferFee,
          otherFee,
          note,
        }),
      });

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
      const response = await fetch(`/api/loan-check/${loanApplicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reviewNotes: rejectReason }),
      });

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'primary' | 'success' | 'warning' | 'destructive' | 'secondary'; label: string }> = {
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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error && !loanData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/50 p-4">
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
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/50 p-4">
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
                <br />และได้แจ้งเตือนผ่าน LINE แล้ว
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
      <div className="min-h-screen w-full flex items-center justify-center bg-muted/50 p-4">
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
                <br />และได้แจ้งเตือนผ่าน LINE แล้ว
              </p>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 mb-6">
                <p className="text-destructive text-sm">
                  เหตุผล: {rejectReason}
                </p>
              </div>
              <Button variant="destructive" onClick={() => window.close()} className="w-full">
                ปิดหน้านี้
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const canApprove = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'].includes(loanData?.status || '');

  return (
    <div className="min-h-screen w-full bg-muted/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">ตรวจสอบสินเชื่อ</h1>
              <p className="text-xs text-muted-foreground">ID: {loanApplicationId.slice(0, 8)}...</p>
            </div>
          </div>
          {loanData && getStatusBadge(loanData.status)}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-32 space-y-4">
        <AnimatePresence mode="wait">
          {/* Loan Details View */}
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Amount Card */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6">
                  <p className="text-primary-foreground/70 text-sm mb-1">ยอดสินเชื่อที่ขอ</p>
                  <p className="text-3xl font-bold">฿{formatCurrency(loanAmount)}</p>
                  <div className="flex items-center gap-4 mt-4 text-primary-foreground/70 text-sm">
                    <span>ดอกเบี้ย {loanData?.interestRate || 0}%/ปี</span>
                    <span>•</span>
                    <span>{loanData?.termMonths || 0} เดือน</span>
                  </div>
                </CardContent>
              </Card>

              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-5 h-5 text-primary" />
                    ข้อมูลที่ดิน/ทรัพย์
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {loanData?.landNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">เลขโฉนด</span>
                      <span className="font-medium">{loanData.landNumber}</span>
                    </div>
                  )}
                  {loanData?.ownerName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ชื่อเจ้าของ</span>
                      <span className="font-medium">{loanData.ownerName}</span>
                    </div>
                  )}
                  {loanData?.propertyLocation && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ที่ตั้ง</span>
                      <span className="font-medium text-right max-w-[200px]">{loanData.propertyLocation}</span>
                    </div>
                  )}
                  {loanData?.propertyArea && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">พื้นที่</span>
                      <span className="font-medium">{loanData.propertyArea}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Info */}
              {loanData?.customer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-5 h-5 text-primary" />
                      ข้อมูลผู้กู้
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {loanData.customer.fullName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ชื่อ-นามสกุล</span>
                        <span className="font-medium">{loanData.customer.fullName}</span>
                      </div>
                    )}
                    {loanData.customer.phoneNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เบอร์โทร</span>
                        <span className="font-medium">{loanData.customer.phoneNumber}</span>
                      </div>
                    )}
                    {loanData.customer.idCardNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เลขบัตรประชาชน</span>
                        <span className="font-medium">{loanData.customer.idCardNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Images */}
              {(loanData?.titleDeedImage || (loanData?.supportingImages && loanData.supportingImages.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ImageIcon className="w-5 h-5 text-primary" />
                      เอกสารแนบ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {loanData?.titleDeedImage && (
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={loanData.titleDeedImage}
                            alt="โฉนดที่ดิน"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {loanData?.supportingImages?.map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={img}
                            alt={`รูปเพิ่มเติม ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Notes */}
              {loanData?.reviewNotes && (
                <Card className="border-warning">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">หมายเหตุ</p>
                        <p className="text-sm text-muted-foreground">{loanData.reviewNotes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Approve Step 1: Select Account */}
          {currentStep === 'approve-step1' && (
            <motion.div
              key="approve-step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      1
                    </div>
                    <CardTitle className="text-base">เลือกบัญชีสำหรับจ่ายสินเชื่อ</CardTitle>
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
                          <Building2 className={`w-5 h-5 ${
                            selectedAccountId === account.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <div>
                            <p className={`font-medium ${
                              selectedAccountId === account.id ? 'text-primary' : ''
                            }`}>
                              {account.accountName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ยอดคงเหลือ: ฿{formatCurrency(account.accountBalance)}
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
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      2
                    </div>
                    <CardTitle className="text-base">ข้อมูลการคำนวณรายการสินเชื่อ</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Loan Amount - Readonly */}
                  <div className="space-y-2">
                    <Label>ยอดสินเชื่อ</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={formatCurrency(loanAmount)}
                        disabled
                        className="pr-12 bg-muted"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
                    </div>
                  </div>

                  {/* Loan Years */}
                  <div className="space-y-2">
                    <Label>จำนวนปี <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={loanYears}
                        onChange={(e) => setLoanYears(parseFloat(e.target.value) || 1)}
                        min={1}
                        step={1}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">ปี</span>
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div className="space-y-2">
                    <Label>ดอกเบี้ย/ปี <span className="text-destructive">*</span></Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                        className="pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Calculated fields */}
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
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
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท/เดือน</span>
                    </div>
                  </div>

                  {/* Fees */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ค่าดำเนินการ</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={operationFee || ''}
                            onChange={(e) => setOperationFee(parseFloat(e.target.value) || 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>ค่าโอน</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={transferFee || ''}
                            onChange={(e) => setTransferFee(parseFloat(e.target.value) || 0)}
                            min={0}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>ค่าใช้จ่ายอื่น ๆ</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={otherFee || ''}
                          onChange={(e) => setOtherFee(parseFloat(e.target.value) || 0)}
                          min={0}
                          className="pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
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
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">บาท</span>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
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

              {/* Summary Bar */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="py-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-primary-foreground/70 text-xs mb-1">ยอดสินเชื่อรวม</p>
                      <p className="font-bold">฿{formatCurrency(totalLoanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/70 text-xs mb-1">งวดละ</p>
                      <p className="font-bold text-yellow-300">฿{formatCurrency(monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-primary-foreground/70 text-xs mb-1">ยอดจ่ายจริง</p>
                      <p className="font-bold text-green-300">฿{formatCurrency(actualPayment)}</p>
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
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <CardTitle className="text-base">ปฏิเสธสินเชื่อ</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Label>เหตุผลในการปฏิเสธ <span className="text-destructive">*</span></Label>
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
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
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
            <p className="text-muted-foreground">สินเชื่อนี้ได้รับการดำเนินการแล้ว</p>
          </div>
        </div>
      )}
    </div>
  );
}
