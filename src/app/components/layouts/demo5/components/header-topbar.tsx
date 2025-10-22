'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoreClientTopbar } from '@src/app/(protected)/store-client/components/common/topbar';
import { SearchDialog } from '@src/app/components/partials/dialogs/search/search-dialog';
import { AppsDropdownMenu } from '@src/app/components/partials/topbar/apps-dropdown-menu';
import { ChatSheet } from '@src/app/components/partials/topbar/chat-sheet';
import { NotificationsSheet } from '@src/app/components/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@src/app/components/partials/topbar/user-dropdown-menu';
import { Button } from '@src/shared/components/ui/button';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import {
  LayoutGrid,
  MessageCircleMore,
  MessageSquareDot,
  Search,
  Users,
} from 'lucide-react';

export function HeaderTopbar() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 lg:gap-3.5">
      <>
        {pathname.startsWith('/store-client') ? (
          <StoreClientTopbar />
        ) : (
          <>
            <Button variant="outline" asChild>
              <Link href="/account/members/team-members">
                <Users />
                Add <span className="hidden md:inline">Teammate</span>
              </Link>
            </Button>

            <div className="flex items-center gap-1">
              <SearchDialog
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="hover:bg-transparent hover:[&_svg]:text-primary"
                  >
                    <Search className="size-4.5!" />
                  </Button>
                }
              />
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
              <AppsDropdownMenu
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="hover:bg-transparent hover:[&_svg]:text-primary"
                  >
                    <LayoutGrid className="size-4.5!" />
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
            </div>

            <UserDropdownMenu
              trigger={
                <img
                  className="cursor-pointer size-9 rounded-full border-2 border-mono/25 shrink-0"
                  src={toAbsoluteUrl('/media/avatars/300-2.png')}
                  alt="User Avatar"
                />
              }
            />
          </>
        )}
      </>
    </div>
  );
}
