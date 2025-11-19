'use client';

import { Fragment } from 'react';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { useGetFinancialSummary } from '@src/features/financial-summary/hooks';

interface IFinancialCard {
  logo: string;
  info: string;
  desc: string;
}
type IFinancialCards = Array<IFinancialCard>;

export function FinancialSummaryCards() {
  const { data, isLoading, isError } = useGetFinancialSummary();

  const financialData = data?.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const items: IFinancialCards = [
    {
      logo: 'user.png',
      info: `฿${formatCurrency(financialData?.investmentAmount || 0)}`,
      desc: 'เงินลงทุนจริง',
    },
    {
      logo: 'loan.png',
      info: `฿${formatCurrency(financialData?.totalActiveLoanAmount || 0)}`,
      desc: 'ยอดวงเงินกู้รวม',
    },
    {
      logo: '2.png',
      info: `฿${formatCurrency(financialData?.cashInAccounts || 0)}`,
      desc: 'เงินสดในบัญชี',
    },
    {
      logo: 'reward.png',
      info: `฿${formatCurrency(financialData?.totalCompletedLoanAmount || 0)}`,
      desc: 'วงเงินที่ปิดบัญชีแล้ว',
    },
    {
      logo: 'user.png',
      info: `฿${formatCurrency(financialData?.netAssets || 0)}`,
      desc: 'ทรัพย์สินสุทธิ',
    },
  ];

  const renderItem = (item: IFinancialCard, index: number) => {
    return (
      <Card key={index}>
        <CardContent className="p-0 flex flex-col justify-between gap-6 h-full bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat financial-stats-bg">
          <img
            src={toAbsoluteUrl(`/images/${item.logo}`)}
            className="w-7 mt-4 ms-5"
            alt="image"
          />
          <div className="flex flex-col gap-1 pb-4 px-5">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : isError ? (
              <>
                <span className="text-2xl font-semibold text-destructive">
                  Error
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {item.desc}
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-mono">
                  {item.info}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {item.desc}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <style>
        {`
          .financial-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3.png')}');
          }
          .dark .financial-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3-dark.png')}');
          }
        `}
      </style>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 lg:gap-7.5">
        {items.map((item, index) => {
          return renderItem(item, index);
        })}
      </div>
    </>
  );
}

