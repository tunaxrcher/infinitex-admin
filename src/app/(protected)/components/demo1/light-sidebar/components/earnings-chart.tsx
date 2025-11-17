import { ApexOptions } from 'apexcharts';
import ApexChart from 'react-apexcharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { Skeleton } from '@src/shared/components/ui/skeleton';

interface MonthlyData {
  month: number;
  monthName: string;
  loanAmount: number;
  totalPayment: number;
  interestPayment: number;
  closeAccountPayment: number;
  overduePayment: number;
  profit: number;
}

interface EarningsChartProps {
  data?: MonthlyData[];
  isLoading?: boolean;
}

const EarningsChart = ({
  data = [],
  isLoading = false,
}: EarningsChartProps) => {
  // English month names mapping
  const monthNamesEn = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const chartData = data.map((item) => item.profit); // Use actual profit values in Baht
  const categories = data.map((item) => monthNamesEn[item.month - 1]); // Get English month names

  // Calculate max value for chart scaling
  const maxProfit = Math.max(...chartData, 0);
  const chartMax = Math.ceil(maxProfit * 1.2); // 20% more than max for better visualization

  const options: ApexOptions = {
    series: [
      {
        name: 'กำไร',
        data: chartData,
      },
    ],
    chart: {
      height: 250,
      type: 'area',
      toolbar: {
        show: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    stroke: {
      curve: 'smooth',
      show: true,
      width: 3,
      colors: ['var(--color-primary)'],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: 'var(--color-secondary-foreground)',
          fontSize: '12px',
        },
      },
      crosshairs: {
        position: 'front',
        stroke: {
          color: 'var(--color-primary)',
          width: 1,
          dashArray: 3,
        },
      },
      tooltip: {
        enabled: false,
        formatter: undefined,
        offsetY: 0,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      min: 0,
      max: chartMax || 100,
      tickAmount: 5,
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: 'var(--color-secondary-foreground)',
          fontSize: '12px',
        },
        formatter: (defaultValue) => {
          return `฿${(defaultValue / 1000).toFixed(0)}K`;
        },
      },
    },
    tooltip: {
      enabled: true,
      custom({ series, seriesIndex, dataPointIndex, w }) {
        const number = parseInt(series[seriesIndex][dataPointIndex]);
        return `
          <div class="flex flex-col gap-2 p-3.5">
            <div class="font-medium text-sm text-secondary-foreground mb-1">${w.config.xaxis.categories[dataPointIndex]}</div>
            <div class="flex items-center gap-1.5">
              <div class="rounded-full size-1.5 bg-primary"></div>
              <div class="text-xs text-tertiary-foreground font-medium me-2">กำไร:</div>
              <div class="text-xs font-semibold text-mono">฿${number.toLocaleString()}</div>
            </div>
          </div>
        `;
      },
    },
    markers: {
      size: 0,
      colors: 'var(--color-white)',
      strokeColors: 'var(--color-primary)',
      strokeWidth: 4,
      strokeOpacity: 1,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      shape: 'circle',
      offsetX: 0,
      offsetY: 0,
      onClick: undefined,
      onDblClick: undefined,
      showNullDataPoints: true,
      hover: {
        size: 8,
        sizeOffset: 0,
      },
    },
    fill: {
      gradient: {
        opacityFrom: 0.25,
        opacityTo: 0,
      },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>กราฟ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-[250px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>กราฟ</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-end items-stretch grow px-3 py-1">
        <ApexChart
          id="earnings_chart"
          options={options}
          series={options.series}
          type="area"
          max-width="694"
          height="250"
        />
      </CardContent>
    </Card>
  );
};

export { EarningsChart, type EarningsChartProps };
