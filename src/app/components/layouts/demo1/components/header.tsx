'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoreClientTopbar } from '@src/app/(protected)/store-client/components/common/topbar';
import { SearchDialog } from '@src/app/components/partials/dialogs/search/search-dialog';
import { AppsDropdownMenu } from '@src/app/components/partials/topbar/apps-dropdown-menu';
import { ChatSheet } from '@src/app/components/partials/topbar/chat-sheet';
import { NotificationsSheet } from '@src/app/components/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@src/app/components/partials/topbar/user-dropdown-menu';
import { useIsMobile } from '@src/shared/hooks/use-mobile';
import { useScrollPosition } from '@src/shared/hooks/use-scroll-position';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { cn } from '@src/shared/lib/utils';
import {
  Bell,
  LayoutGrid,
  Menu,
  MessageCircleMore,
  Search,
  SquareChevronRight,
} from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@src/shared/components/ui/sheet';
import { Container } from '@src/shared/components/common/container';
import { Breadcrumb } from './breadcrumb';
import { MegaMenu } from './mega-menu';
import { MegaMenuMobile } from './mega-menu-mobile';
import { SidebarMenu } from './sidebar-menu';

export function Header() {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const [isMegaMenuSheetOpen, setIsMegaMenuSheetOpen] = useState(false);

  const pathname = usePathname();
  const mobileMode = useIsMobile();

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
    setIsMegaMenuSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex gap-1 lg:hidden items-center gap-2.5">
          <Link href="/" className="shrink-0">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[25px] w-full"
              alt="mini-logo"
            />
          </Link>
          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="p-0 space-y-0" />
                  <SheetBody className="p-0 overflow-y-auto">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
            {mobileMode && (
              <Sheet
                open={isMegaMenuSheetOpen}
                onOpenChange={setIsMegaMenuSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <SquareChevronRight className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="p-0 space-y-0" />
                  <SheetBody className="p-0 overflow-y-auto">
                    <MegaMenuMobile />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Main Content (MegaMenu or Breadcrumbs) */}
        {pathname.startsWith('/account') ? (
          <Breadcrumb />
        ) : (
          !mobileMode && <MegaMenu />
        )}

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
          {pathname.startsWith('/store-client') ? (
            <StoreClientTopbar />
          ) : (
            <>
              {!mobileMode && (
                <SearchDialog
                  trigger={
                    <Button
                      variant="ghost"
                      mode="icon"
                      shape="circle"
                      className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                    >
                      <Search className="size-4.5!" />
                    </Button>
                  }
                />
              )}
              <NotificationsSheet
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  >
                    <Bell className="size-4.5!" />
                  </Button>
                }
              />
              <ChatSheet
                trigger={
                  <Button
                    variant="ghost"
                    mode="icon"
                    shape="circle"
                    className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
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
                    className="size-9 hover:bg-primary/10 hover:[&_svg]:text-primary"
                  >
                    <LayoutGrid className="size-4.5!" />
                  </Button>
                }
              />
              <UserDropdownMenu
                trigger={
                  <img
                    className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer"
                    src={toAbsoluteUrl('/media/avatars/300-2.png')}
                    alt="User Avatar"
                  />
                }
              />
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
