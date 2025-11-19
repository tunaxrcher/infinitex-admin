'use client';

import { Fragment } from 'react';
import { useStoreClient } from '@src/app/(protected)/store-client/components/context';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { Card, CardContent } from '@src/shared/components/ui/card';

interface ICard1Item {
  logo: string;
  brand: string;
}
type ICard1Items = Array<ICard1Item>;

export function SettingLists() {
  const { showProductDetailsSheet } = useStoreClient();

  const items: ICard1Items = [
    { logo: 'setting1.png', brand: 'ตั้งค่าบัญชี' },
    { logo: 'setting2.png', brand: 'ตั้งค่าทุน' },
    { logo: 'setting3.png', brand: 'demo' },
    { logo: 'setting3.png', brand: 'demo' },
    { logo: 'setting3.png', brand: 'demo' },
    { logo: 'setting3.png', brand: 'demo' },
    { logo: 'setting3.png', brand: 'demo' },
  ];

  const renderItem = (item: ICard1Item, index: number) => (
    <Card key={index}>
      <CardContent className="flex flex-col items-center justify-center pb-0">
        <div
          onClick={() => showProductDetailsSheet('productid')}
          className="hover:text-primary text-sm font-medium text-mono cursor-pointer"
        >
          {item.brand}
        </div>

        <img
          src={toAbsoluteUrl(`/images/${item.logo}`)}
          className="cursor-pointer h-[100px] shrink-0"
          alt="image"
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="grid sm:grid-cols-4 xl:grid-cols-7 gap-5 mb-2">
      <Fragment>
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </Fragment>
    </div>
  );
}
