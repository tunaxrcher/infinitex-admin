'use client';

import { useState } from 'react';
import amphurData from '@src/data/amphur.json';
import provinceData from '@src/data/province.json';
import { AddLoanMethodModal } from '@src/features/loans/components/add-loan-method-modal';
import { FinancialSummaryCards } from '@src/features/loans/components/financial-summary-cards';
import { ProductFormSheet } from '@src/features/loans/components/product-form-sheet';
import { SectionNavigation } from '@src/features/loans/components/section-navigation';
import { TitleDeedManualInputModal } from '@src/features/loans/components/title-deed-manual-input-modal';
import { TitleDeedUploadDialog } from '@src/features/loans/components/title-deed-upload-dialog';
import { LoanPaymentReportsTable } from '@src/features/loans/tables/loan-payment-reports';
import { ProductListTable } from '@src/features/loans/tables/product-list';
import { PlusIcon } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';

export default function ProductList() {
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [isTitleDeedUploadOpen, setIsTitleDeedUploadOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [titleDeedAnalysisResult, setTitleDeedAnalysisResult] =
    useState<any>(null);
  const [finalTitleDeedData, setFinalTitleDeedData] = useState<any>(null);
  const [uploadedTitleDeedImage, setUploadedTitleDeedImage] = useState<
    string | null
  >(null);

  // Handle menu selection
  const handleManualAdd = () => {
    setIsCreateProductOpen(true);
  };

  const handleAIAdd = () => {
    setIsTitleDeedUploadOpen(true);
  };

  // Handle upload complete from AI
  const handleUploadComplete = (result: any) => {
    console.log('[ProductList] Upload complete:', result);
    setTitleDeedAnalysisResult(result);
    setIsTitleDeedUploadOpen(false);

    // Store the uploaded image URL
    if (result.imageUrl) {
      setUploadedTitleDeedImage(result.imageUrl);
    }

    // Check if needs manual input
    if (result.needsManualInput) {
      setIsManualInputOpen(true);
    } else if (result.titleDeedData) {
      // Directly open form with data
      setFinalTitleDeedData(result.titleDeedData);
      setIsCreateProductOpen(true);
    }
  };

  // Handle skip from upload dialog
  const handleSkipUpload = () => {
    setIsTitleDeedUploadOpen(false);
    setIsCreateProductOpen(true);
  };

  // Handle skip from manual input modal
  const handleSkipManualInput = () => {
    setIsManualInputOpen(false);
    setIsCreateProductOpen(true);
  };

  // Handle confirm from manual input modal
  const handleConfirmManualInput = async (data: {
    pvCode: string;
    amCode: string;
    parcelNo: string;
  }) => {
    console.log('[ProductList] Manual input confirmed:', data);

    try {
      const response = await fetch('/api/loans/title-deed/manual-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการค้นหาข้อมูล');
      }

      const result = await response.json();
      console.log('[ProductList] Manual lookup result:', result);

      if (result.success && result.titleDeedData) {
        // Replace parcelno with user input (because API returns masked value like xxxx98)
        const enrichedData = {
          ...result.titleDeedData,
          result: result.titleDeedData.result?.map((item: any) => ({
            ...item,
            parcelno: data.parcelNo, // Use user input instead of masked value
          })),
          userInputParcelNo: data.parcelNo, // Store original user input
        };

        setFinalTitleDeedData(enrichedData);
        setIsManualInputOpen(false);
        setIsCreateProductOpen(true);
      } else {
        throw new Error('ไม่พบข้อมูลโฉนดที่ดิน');
      }
    } catch (error: any) {
      console.error('[ProductList] Manual lookup failed:', error);
      alert(error.message || 'เกิดข้อผิดพลาดในการค้นหาข้อมูล');
    }
  };

  // Handle form close
  const handleFormClose = (open: boolean) => {
    setIsCreateProductOpen(open);
    if (!open) {
      // Reset all states when form closes
      setTitleDeedAnalysisResult(null);
      setFinalTitleDeedData(null);
      setUploadedTitleDeedImage(null);
    }
  };

  return (
    <>
      <Container>
        <div className="container-fluid space-y-5 lg:space-y-9 pb-20 lg:pb-5">
          {/* Section 1: Financial Summary */}
          <div id="financial-summary" className="scroll-mt-20">
            <FinancialSummaryCards />
          </div>

          <div className="flex items-center flex-wrap dap-2.5 justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="gradientText text-xl font-bold text-foreground">
                รายการสินเชื่อ
              </h1>
              <span className="text-sm text-muted-foreground">
                รายการสินเชื่อทั้งหมดใน InfiniteX และสถานะต่าง ๆ
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="mono"
                className="gap-2 gradientButton"
                onClick={() => setIsMethodModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                เพิ่มสินเชื่อ
              </Button>
            </div>
          </div>

          {/* Section 2: Product List Table */}
          <div id="loan-list" className="scroll-mt-20">
            <ProductListTable />
          </div>

          {/* Section 3: Loan Payment Reports */}
          <div id="payment-reports" className="scroll-mt-20">
            <div className="flex items-center flex-wrap justify-between mb-5">
              <div className="flex flex-col gap-1">
                <h1 className="gradientText text-xl font-bold text-foreground">
                  รายงานการชำระสินเชื่อ
                </h1>
                <span className="text-sm text-muted-foreground">
                  แสดงรายการธุรกรรมเกี่ยวกับสินเชื่อ
                </span>
              </div>
            </div>
            <LoanPaymentReportsTable />
          </div>

          {/* Add Loan Method Modal */}
          <AddLoanMethodModal
            isOpen={isMethodModalOpen}
            onClose={() => setIsMethodModalOpen(false)}
            onManualAdd={handleManualAdd}
            onAIAdd={handleAIAdd}
          />

          {/* Create Product Modal */}
          <ProductFormSheet
            mode="new"
            open={isCreateProductOpen}
            onOpenChange={handleFormClose}
            initialTitleDeedData={finalTitleDeedData}
            initialTitleDeedImage={uploadedTitleDeedImage}
          />

          {/* Title Deed Upload Dialog */}
          <TitleDeedUploadDialog
            isOpen={isTitleDeedUploadOpen}
            onClose={() => setIsTitleDeedUploadOpen(false)}
            onUploadComplete={handleUploadComplete}
            onSkip={handleSkipUpload}
          />

          {/* Manual Input Modal */}
          {titleDeedAnalysisResult && (
            <TitleDeedManualInputModal
              isOpen={isManualInputOpen}
              onClose={() => setIsManualInputOpen(false)}
              onSkip={handleSkipManualInput}
              onConfirm={handleConfirmManualInput}
              initialData={{
                pvCode: titleDeedAnalysisResult.analysisResult?.pvCode,
                amCode: titleDeedAnalysisResult.analysisResult?.amCode,
                parcelNo: titleDeedAnalysisResult.analysisResult?.parcelNo,
              }}
              errorMessage={titleDeedAnalysisResult.errorMessage}
              provinces={provinceData}
              amphurs={amphurData}
            />
          )}
        </div>
      </Container>

      {/* Section Navigation */}
      <SectionNavigation />
    </>
  );
}
