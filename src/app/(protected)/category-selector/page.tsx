'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetDocumentTitleList } from '@src/features/documents/hooks';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import { useState } from 'react';

interface CategoryItem {
  id: string;
  title: string;
  note?: string;
}

function CategorySelectorContent() {
  const searchParams = useSearchParams();
  const docType = searchParams.get('docType') || 'RECEIPT';
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useGetDocumentTitleList({
    docType: docType as 'RECEIPT' | 'PAYMENT_VOUCHER' | 'DISCOUNT_NOTE' | 'EXPENSE',
    search: searchQuery || undefined,
    page: 1,
    limit: 100,
  });

  const categories: CategoryItem[] = data?.data || [];

  const handleSelectCategory = (category: CategoryItem) => {
    // Send selected category to parent window
    if (window.opener && typeof (window.opener as any).__onCategorySelected === 'function') {
      (window.opener as any).__onCategorySelected({ title: category.title });
    }
    window.close();
  };

  const getTitle = () => {
    switch (docType) {
      case 'RECEIPT':
        return 'เลือกหมวดหมู่ใบสำคัญรับ';
      case 'PAYMENT_VOUCHER':
        return 'เลือกหมวดหมู่ใบสำคัญจ่าย';
      default:
        return 'เลือกหมวดหมู่';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            คลิกเลือกหมวดหมู่ที่ต้องการ
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="ค้นหาหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Category List */}
        <div className="border rounded-lg bg-card">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              กำลังโหลด...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>ไม่พบหมวดหมู่</p>
              <p className="text-xs mt-2">กรุณาเพิ่มหมวดหมู่ในระบบก่อน</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between group"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <div>
                      <span className="font-medium text-foreground">
                        {category.title}
                      </span>
                      {category.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {category.note}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      เลือก →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => window.close()}>
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CategorySelectorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <CategorySelectorContent />
    </Suspense>
  );
}

