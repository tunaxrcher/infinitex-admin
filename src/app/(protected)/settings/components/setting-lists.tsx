'use client';

import { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { InvestmentFormDialog } from './investment-form-dialog';

interface ICard1Item {
  logo: string;
  brand: string;
  action: 'navigate' | 'dialog';
  path?: string;
  disabled?: boolean;
}
type ICard1Items = Array<ICard1Item>;

export function SettingLists() {
  const router = useRouter();
  const [isInvestmentSheetOpen, setIsInvestmentSheetOpen] = useState(false);

  const items: ICard1Items = [
    {
      logo: 'setting1.png',
      brand: 'ตั้งค่าบัญชี',
      action: 'navigate',
      path: '/settings/accounts',
    },
    { logo: 'setting2.png', brand: 'ตั้งค่าทุน', action: 'dialog' },
    { logo: 'setting3.png', brand: 'demo', action: 'navigate', disabled: true },
    { logo: 'setting3.png', brand: 'demo', action: 'navigate', disabled: true },
    { logo: 'setting3.png', brand: 'demo', action: 'navigate', disabled: true },
    { logo: 'setting3.png', brand: 'demo', action: 'navigate', disabled: true },
    { logo: 'setting3.png', brand: 'demo', action: 'navigate', disabled: true },
  ];

  const handleItemClick = (item: ICard1Item) => {
    if (item.disabled) return;
    
    if (item.action === 'navigate' && item.path) {
      router.push(item.path);
    } else if (item.action === 'dialog' && item.brand === 'ตั้งค่าทุน') {
      setIsInvestmentSheetOpen(true);
    }
  };

  const renderItem = (item: ICard1Item, index: number) => (
    <Card key={index} className={item.disabled ? 'opacity-40' : ''}>
      <CardContent className="flex flex-col items-center justify-center pb-0">
        <div
          onClick={() => handleItemClick(item)}
          className={`text-sm font-medium text-mono ${
            item.disabled
              ? 'cursor-not-allowed'
              : 'hover:text-primary cursor-pointer'
          }`}
        >
          {item.brand}
        </div>

        <img
          src={toAbsoluteUrl(`/images/${item.logo}`)}
          className={`h-[100px] shrink-0 ${
            item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
          alt="image"
          onClick={() => handleItemClick(item)}
        />
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="grid sm:grid-cols-4 xl:grid-cols-7 gap-5 mb-2">
        <Fragment>
          {items.map((item, index) => {
            return renderItem(item, index);
          })}
        </Fragment>
      </div>

      {/* Investment Form Dialog */}
      <InvestmentFormDialog
        open={isInvestmentSheetOpen}
        onOpenChange={setIsInvestmentSheetOpen}
      />
    </>
  );
}
