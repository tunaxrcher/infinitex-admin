'use client';

import { AppsDropdownMenu } from '@src/app/components/partials/topbar/apps-dropdown-menu';
import { ChatSheet } from '@src/app/components/partials/topbar/chat-sheet';
import { UserDropdownMenu } from '@src/app/components/partials/topbar/user-dropdown-menu';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { LayoutGrid, MessageCircleMore } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';

export function SidebarFooter() {
  return (
    <div className="flex flex-center justify-between shrink-0 ps-4 pe-3.5 mb-3.5">
      <UserDropdownMenu
        trigger={
          <img
            className="size-9 rounded-full border-2 border-mono/25 shrink-0 cursor-pointer"
            src={toAbsoluteUrl('/media/avatars/300-2.png')}
            alt="User Avatar"
          />
        }
      />

      <div className="flex items-center gap-1.5">
        <ChatSheet
          trigger={
            <Button
              variant="ghost"
              mode="icon"
              className="hover:bg-background hover:[&_svg]:text-primary"
            >
              <MessageCircleMore className="size-4.5!" />
            </Button>
          }
        />

        <AppsDropdownMenu
          trigger={
            <Button
              variant="ghost"
              mode="icon"
              className="hover:bg-background hover:[&_svg]:text-primary"
            >
              <LayoutGrid className="size-4.5!" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
