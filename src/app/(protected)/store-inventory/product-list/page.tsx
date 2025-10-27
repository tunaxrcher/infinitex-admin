'use client';

import { useState } from 'react';
import { Container } from '@src/shared/components/common/container';
import { Button } from '@src/shared/components/ui/button';
import { PlusIcon, Upload } from 'lucide-react';
import { ProductFormSheet } from '../components/product-form-sheet';
import { ProductListTable } from '../tables/product-list';

export default function ProductList() {
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  return (
    <Container>
      <div className="container-fluid space-y-5 lg:space-y-9">
        <div className="flex items-center flex-wrap dap-2.5 justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-foreground">รายการสินเชื่อ</h1>
            <span className="text-sm text-muted-foreground">
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              variant="mono"
              className="gap-2"
              onClick={() => setIsCreateProductOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              เพิ่มสินเชื่อ
            </Button>
          </div>
        </div>

        {/* Product List Table */}
        <ProductListTable />

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
