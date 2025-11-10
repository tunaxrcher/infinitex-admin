'use client';

import Link from 'next/link';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { cn } from '@src/shared/lib/utils';
import { useSettings } from '@src/shared/providers/settings-provider';
import { ChevronFirst } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link href="/">
        <div className="dark:hidden">
          <img
            src={toAbsoluteUrl('/images/logo.png')}
            className="default-logo h-[32px] max-w-none"
            alt="Default Logo"
          />
          <img
            src={toAbsoluteUrl('/images/logo.png')}
            className="small-logo h-[32px] max-w-none"
            alt="Mini Logo"
          />
        </div>
        <div className="hidden dark:block">
          <img
            src={toAbsoluteUrl('/images/logo.png')}
            className="default-logo h-[32px] max-w-none"
            alt="Default Dark Logo"
          />
          <img
            src={toAbsoluteUrl('/images/logo.png')}
            className="small-logo h-[32px] max-w-none"
            alt="Mini Logo"
          />
        </div>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          settings.layouts.demo1.sidebarCollapse
            ? 'ltr:rotate-180'
            : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
