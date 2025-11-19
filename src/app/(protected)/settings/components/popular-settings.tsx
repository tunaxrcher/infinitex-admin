'use client';

import Link from 'next/link';

import { ChevronRight } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Card1 } from '../special-offers/card1';
import { Card2 } from '../special-offers/card2';

export function PopularSettings() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <span className="text-lg font-medium text-mono">ใช้งานล่าสุด</span>
{/* 
        <Button mode="link" asChild>
          <Link href="/account/home/get-started" className="text-xs">
            See All <ChevronRight />
          </Link>
        </Button> */}
      </div>

      <div className="grid xl:grid-cols-2 gap-5 mb-2">
        <div className="lg:col-span-1">
          <Card1 />
        </div>

        <div className="lg:col-span-1">
          <div className="grid sm:grid-cols-2 gap-5 items-stretch">
            <Card2
              logo="setting3.png"
              title="ชื่อการตั้งค่า"
              total=""
              bgColor="bg-green-50 dark:bg-green-950/30"
              borderColor="border-green-200 dark:border-green-950"
            />
            <Card2
              logo="setting3.png"
              title="ชื่อการตั้งค่า"
              total=""
              bgColor="bg-primary/10"
              borderColor="border-primary/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
