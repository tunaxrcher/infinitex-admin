'use client';

import { usePathname } from 'next/navigation';
import { StoreClientTopbar } from '@src/app/(protected)/store-client/components/common/topbar';
import { DropdownMenu2 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-2';
import { ChatSheet } from '@src/app/components/partials/topbar/chat-sheet';
import { NotificationsSheet } from '@src/app/components/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@src/app/components/partials/topbar/user-dropdown-menu';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { ChevronDown, MessageCircleMore, MessageSquareDot } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Label } from '@src/shared/components/ui/label';
import { Switch } from '@src/shared/components/ui/switch';

export function HeaderTopbar() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 lg:gap-3.5 lg:w-[400px] justify-end">
      {pathname.startsWith('/store-client') ? (
        <StoreClientTopbar />
      ) : (
        <>
          <div className="flex items-center gap-2 me-0.5">
            <ChatSheet
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="hover:bg-transparent hover:[&_svg]:text-primary"
                >
                  <MessageCircleMore className="size-4.5!" />
                </Button>
              }
            />

            <NotificationsSheet
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="hover:bg-transparent hover:[&_svg]:text-primary"
                >
                  <MessageSquareDot className="size-4.5!" />
                </Button>
              }
            />

            <UserDropdownMenu
              trigger={
                <img
                  className="ms-2.5 size-9 rounded-full border-2 border-success shrink-0 cursor-pointer"
                  src={toAbsoluteUrl('/media/avatars/300-2.png')}
                  alt="User Avatar"
                />
              }
            />
          </div>

          <div className="border-e border-border h-5"></div>

          <div className="flex items-center space-x-2">
            <Switch id="auto-update" size="sm" defaultChecked />
            <Label htmlFor="auto-update">Pro</Label>
          </div>

          <div className="border-e border-border h-5"></div>

          <DropdownMenu2
            trigger={
              <Button variant="mono">
                Create
                <ChevronDown />
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}
