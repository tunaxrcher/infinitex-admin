'use client';

import { useState } from 'react';
import { PlusIcon, Upload } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { FinancialSummaryCards } from '../components/financial-summary-cards';
import { ProductFormSheet } from '../components/product-form-sheet';
import { LoanPaymentReportsTable } from '../tables/loan-payment-reports';
import { ProductListTable } from '../tables/product-list';

export default function ProductList() {
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  return (
    <Container>
      <div className="container-fluid space-y-5 lg:space-y-9">
        {/* Financial Summary Cards */}
        <FinancialSummaryCards />

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
              onClick={() => setIsCreateProductOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              เพิ่มสินเชื่อ
            </Button>
          </div>
        </div>

        {/* Product List Table */}
        <ProductListTable />

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

        {/* Loan Payment Reports Table */}
        <LoanPaymentReportsTable />

        {/* Create Product Modal */}
        <ProductFormSheet
          mode="new"
          open={isCreateProductOpen}
          onOpenChange={setIsCreateProductOpen}
        />
      </div>
    </Container>
  );
}
