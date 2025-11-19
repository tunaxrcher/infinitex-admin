'use client';

import { Fragment } from 'react';
import { formatCurrency, toAbsoluteUrl } from '@src/shared/lib/helpers';
import { motion } from 'motion/react';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { CountingNumber } from '@src/shared/components/ui/counting-number';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface IDashboardSummaryItem {
  logo: string;
  logoDark?: string;
  info: string;
  desc: string;
  path: string;
  amount?: number;
}
type IDashboardSummaryItems = Array<IDashboardSummaryItem>;

interface IDashboardSummaryProps {
  currentMonthLoanAmount?: number;
  currentMonthProfit?: number;
  yearProfit?: number;
  isLoading?: boolean;
}

const DashboardSummary = ({
  currentMonthLoanAmount = 0,
  currentMonthProfit = 0,
  yearProfit = 0,
  isLoading = false,
}: IDashboardSummaryProps) => {
  const items: IDashboardSummaryItems = [
    {
      logo: '',
      info: formatCurrency(currentMonthLoanAmount),
      desc: 'ยอดเปิดสินเชื่อ (เดือนนี้)',
      path: '',
      amount: currentMonthLoanAmount,
    },
    {
      logo: '',
      info: formatCurrency(currentMonthProfit),
      desc: 'กำไร (เดือนนี้)',
      path: '',
      amount: currentMonthProfit,
    },
    {
      logo: '',
      info: formatCurrency(yearProfit),
      desc: 'กำไรปีนี้',
      path: '',
      amount: yearProfit,
    },
    {
      logo: '',
      info: '-',
      desc: 'in development',
      path: '',
      amount: 0,
    },
  ];

  const renderItem = (item: IDashboardSummaryItem, index: number) => {
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
      >
        <Card>
          <CardContent className="p-0 flex flex-col justify-between gap-6 h-full bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat channel-stats-bg">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
            >
              {item.logoDark ? (
                <>
                  <img
                    src={toAbsoluteUrl(`/images/user.png`)}
                    className="dark:hidden w-7 mt-4 ms-5"
                    alt="image"
                  />
                  <img
                    src={toAbsoluteUrl(`/images/user.png`)}
                    className="light:hidden w-7 mt-4 ms-5"
                    alt="image"
                  />
                </>
              ) : (
                <img
                  src={toAbsoluteUrl(`/images/user.png`)}
                  className="w-7 mt-4 ms-5"
                  alt="image"
                />
              )}
            </motion.div>
            <div className="flex flex-col gap-1 pb-4 px-5">
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <span className="text-2xl font-semibold text-mono">
                    {item.amount !== undefined && item.amount !== 0 ? (
                      <CountingNumber
                        to={item.amount}
                        duration={1.5}
                        delay={index * 100 + 300}
                        format={(value) => formatCurrency(value)}
                      />
                    ) : (
                      item.info
                    )}
                  </span>
                  <motion.span
                    className="text-sm font-normal text-muted-forehead"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  >
                    {item.desc}
                  </motion.span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <Fragment>
      <style>
        {`
          .channel-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3.png')}');
          }
          .dark .channel-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-3-dark.png')}');
          }
        `}
      </style>

      {items.map((item, index) => {
        return renderItem(item, index);
      })}
    </Fragment>
  );
};

export {
  DashboardSummary,
  type IDashboardSummaryItem,
  type IDashboardSummaryItems,
  type IDashboardSummaryProps,
};
