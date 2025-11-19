'use client';

import { useStoreClient } from '@src/app/(protected)/store-client/components/context';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { Card, CardContent } from '@src/shared/components/ui/card';

export function Card1() {
  const { showCartSheet } = useStoreClient();

  return (
    <Card className="bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-950 h-full">
      <CardContent className="flex items-center flex-wrap sm:flex-nowrap justify-between gap-5 lg:gap-9 px-7.5 pb-0">
        <div className="flex flex-col">
          <div className="mb-3">
            <Badge size="sm" variant="destructive" className="uppercase">
              admin id
            </Badge>
          </div>

          <h3 className="text-[26px] font-semibold text-mono mb-1">
            ชื่อการตั้งค่า
          </h3>

          <span className="text-sm font-normal text-foreground mb-5 leading-5.5">
            รายละเอียด Logs
          </span>

          {/* <div className="flex items-center gap-4">
            <Button size="sm" variant="mono" onClick={showCartSheet}>
              <ShoppingCart /> Add to Card
            </Button>
            <span className="text-base font-semibold text-mono">$140.00</span>
          </div> */}
        </div>

        <img
          src={toAbsoluteUrl('/images/setting3.png')}
          className="h-[250px]"
          alt="image"
        />
      </CardContent>
    </Card>
  );
}
