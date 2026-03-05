'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetDocumentTitleList } from '@src/features/documents/hooks';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';

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
    docType: docType as
      | 'RECEIPT'
      | 'PAYMENT_VOUCHER'
      | 'DISCOUNT_NOTE'
      | 'EXPENSE',
    search: searchQuery || undefined,
    page: 1,
    limit: 100,
  });

  const categories: CategoryItem[] = data?.data || [];

  const handleSelectCategory = (category: CategoryItem) => {
    if (
      window.opener &&
      typeof (window.opener as any).__onCategorySelected === 'function'
    ) {
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
    <div className="p-5">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-lg font-semibold">{getTitle()}</h1>
          <p className="text-sm text-muted-foreground">
            คลิกเลือกหมวดหมู่ที่ต้องการ
          </p>
        </div>

        {/* Search */}
        <Input
          type="text"
          placeholder="ค้นหาหมวดหมู่..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Category List */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
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
            <ul className="divide-y divide-border max-h-[350px] overflow-auto">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors flex items-center justify-between group"
                    onClick={() => handleSelectCategory(category)}
                  >
                    <span className="text-sm">{category.title}</span>
                    <span className="text-xs text-primary opacity-0 group-hover:opacity-100">
                      เลือก →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => window.close()}>
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CategorySelectorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">
          กำลังโหลด...
        </div>
      }
    >
      <CategorySelectorContent />
    </Suspense>
  );
}
