import {
  RemixiconComponentType,
  RiBankLine,
  RiFacebookCircleLine,
  RiGoogleLine,
  RiInstagramLine,
  RiStore2Line,
} from '@remixicon/react';
import { DropdownMenu4 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-4';
import { formatCurrency } from '@src/shared/lib/helpers';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  EllipsisVertical,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Badge, BadgeDot } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface IHighlightsRow {
  icon: LucideIcon | RemixiconComponentType;
  text: string;
  total: string;
  subtitle?: string;
}
type IHighlightsRows = Array<IHighlightsRow>;

interface IHighlightsItem {
  badgeColor: string;
  label: string;
}
type IHighlightsItems = Array<IHighlightsItem>;

interface IHighlightsProps {
  limit?: number;
  totalPaymentYear?: number;
  averagePaymentPerMonth?: number;
  highestPaymentMonth?: {
    month: number;
    monthName: string;
    amount: number;
  };
  lowestPaymentMonth?: {
    month: number;
    monthName: string;
    amount: number;
  };
  isLoading?: boolean;
}

const Highlights = ({
  limit,
  totalPaymentYear = 0,
  averagePaymentPerMonth = 0,
  highestPaymentMonth = { month: 0, monthName: '-', amount: 0 },
  lowestPaymentMonth = { month: 0, monthName: '-', amount: 0 },
  isLoading = false,
}: IHighlightsProps) => {
  const rows: IHighlightsRows = [
    {
      icon: TrendingUp,
      text: 'เดือนที่รับชำระสูงสุด',
      total: formatCurrency(highestPaymentMonth.amount),
      subtitle: highestPaymentMonth.monthName,
    },
    {
      icon: TrendingDown,
      text: 'เดือนที่รับชำระต่ำสุด',
      total: formatCurrency(lowestPaymentMonth.amount),
      subtitle: lowestPaymentMonth.monthName,
    },
    {
      icon: BarChart3,
      text: 'ค่าเฉลี่ยรับชำระต่อเดือน',
      total: formatCurrency(averagePaymentPerMonth),
    },
  ];

  const renderRow = (row: IHighlightsRow, index: number) => {
    if (isLoading) {
      return (
        <div
          key={index}
          className="flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-5 w-24" />
            {row.subtitle && <Skeleton className="h-3 w-16" />}
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className="flex items-center justify-between flex-wrap gap-2"
      >
        <div className="flex items-center gap-1.5">
          <row.icon className="size-4.5 text-muted-foreground" />
          <span className="text-sm font-normal text-mono">{row.text}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-medium text-foreground">
            {row.total}
          </span>
          {row.subtitle && (
            <span className="text-xs text-muted-foreground">
              {row.subtitle}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>สรุปข้อมูล</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-5 lg:p-7.5 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            ยอดรับชำระทั้งปี
          </span>
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-semibold text-mono">
                {formatCurrency(totalPaymentYear)}
              </span>
            </div>
          )}
        </div>
        <div className="border-b border-input"></div>
        <div className="grid gap-3">{rows.slice(0, limit).map(renderRow)}</div>
      </CardContent>
    </Card>
  );
};

export {
  Highlights,
  type IHighlightsRow,
  type IHighlightsRows,
  type IHighlightsItem,
  type IHighlightsItems,
  type IHighlightsProps,
};
