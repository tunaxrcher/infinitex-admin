import { Fragment } from 'react';
import { formatCurrency, toAbsoluteUrl } from '@src/shared/lib/helpers';
import { Card, CardContent } from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface IDashboardSummaryItem {
  logo: string;
  logoDark?: string;
  info: string;
  desc: string;
  path: string;
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
    },
    {
      logo: '',
      info: formatCurrency(currentMonthProfit),
      desc: 'กำไร (เดือนนี้)',
      path: '',
    },
    {
      logo: '',
      info: formatCurrency(yearProfit),
      desc: 'กำไรปีนี้',
      path: '',
    },
    {
      logo: '',
      info: '-',
      desc: 'in development',
      path: '',
    },
  ];

  const renderItem = (item: IDashboardSummaryItem, index: number) => {
    return (
      <Card key={index}>
        <CardContent className="p-0 flex flex-col justify-between gap-6 h-full bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat channel-stats-bg">
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
          <div className="flex flex-col gap-1 pb-4 px-5">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-mono">
                  {item.info}
                </span>
                <span className="text-sm font-normal text-muted-forehead">
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
