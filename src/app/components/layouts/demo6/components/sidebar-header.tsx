'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MENU_ROOT } from '@src/shared/config/menu.config';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { cn } from '@src/shared/lib/utils';
import { ChevronDown, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@src/shared/components/ui/dropdown-menu';
import { Input } from '@src/shared/components/ui/input';

export function SidebarHeader() {
  const pathname = usePathname();
  const [selectedMenuItem, setSelectedMenuItem] = useState(MENU_ROOT[1]);

  const handleInputChange = () => {};

  useEffect(() => {
    MENU_ROOT.forEach((item) => {
      if (item.rootPath && pathname.includes(item.rootPath)) {
        setSelectedMenuItem(item);
      }
    });
  }, [pathname]);

  return (
    <div className="mb-3.5">
      <div className="flex items-center justify-between gap-2.5 px-3.5 h-[70px]">
        <Link href="/">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle.svg')}
            className="dark:hidden h-[42px]"
            alt=""
          />
          <img
            src={toAbsoluteUrl('/media/app/mini-logo-circle-dark.svg')}
            className="hidden dark:inline-block h-[42px]"
            alt=""
          />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer text-mono font-medium flex items-center justify-between gap-2 w-[150px]">
            Metronic Cloud
            <ChevronDown className="size-3.5! text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={10} side="bottom" align="start">
            {MENU_ROOT.map((item, index) => (
              <DropdownMenuItem
                key={index}
                asChild
                className={cn(item === selectedMenuItem && 'bg-accent')}
              >
                <Link href={item.path || ''}>
                  {item.icon && <item.icon />}
                  {item.title}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="pt-2.5 px-3.5 mb-1">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 start-3.5 -translate-y-1/2 size-4" />
          <Input
            placeholder="Search"
            onChange={handleInputChange}
            className="px-9 min-w-0"
            value=""
          />
          <span className="text-xs text-muted-foreground absolute end-3.5 top-1/2 -translate-y-1/2">
            cmd + /
          </span>
        </div>
      </div>
    </div>
  );
}
