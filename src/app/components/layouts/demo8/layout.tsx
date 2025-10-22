'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoreClientTopbar } from '@src/app/(protected)/store-client/components/common/topbar';
import { SearchDialog } from '@src/app/components/partials/dialogs/search/search-dialog';
import { ChatSheet } from '@src/app/components/partials/topbar/chat-sheet';
import { Button } from '@src/shared/components/ui/button';
import { useBodyClass } from '@src/shared/hooks/use-body-class';
import { useIsMobile } from '@src/shared/hooks/use-mobile';
import { useSettings } from '@src/shared/providers/settings-provider';
import { Download, MessageCircleMore, Search } from 'lucide-react';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Sidebar } from './components/sidebar';
import { Toolbar, ToolbarActions, ToolbarHeading } from './components/toolbar';

export function Demo8Layout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { setOption } = useSettings();
  const pathname = usePathname();

  // Using the custom hook to set classes on the body
  useBodyClass(`
    [--header-height:60px]
    [--sidebar-width:90px]
    bg-muted!
  `);

  useEffect(() => {
    setOption('layout', 'demo8');
  }, [setOption]);

  return (
    <>
      <div className="flex grow">
        {isMobile && <Header />}

        <div className="flex flex-col lg:flex-row grow pt-(--header-height) lg:pt-0">
          {!isMobile && <Sidebar />}

          <div className="flex flex-col grow rounded-xl bg-background border border-input lg:ms-(--sidebar-width) mt-0 m-4 lg:m-5">
            <div className="flex flex-col grow kt-scrollable-y-auto lg:[scrollbar-width:auto] pt-5">
              <main className="grow" role="content">
                {!pathname.includes('/user-management') && (
                  <Toolbar>
                    <ToolbarHeading />
                    <ToolbarActions>
                      <>
                        {pathname.startsWith('/store-client') ? (
                          <StoreClientTopbar />
                        ) : (
                          <>
                            <SearchDialog
                              trigger={
                                <Button
                                  variant="ghost"
                                  mode="icon"
                                  className="hover:[&_svg]:text-primary"
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
                                  className="hover:[&_svg]:text-primary"
                                >
                                  <MessageCircleMore className="size-4.5!" />
                                </Button>
                              }
                            />
                            <Button
                              variant="outline"
                              asChild
                              className="ms-2.5 hover:text-primary hover:[&_svg]:text-primary"
                            >
                              <Link href={'/account/home/get-started'}>
                                <Download />
                                Export
                              </Link>
                            </Button>
                          </>
                        )}
                      </>
                    </ToolbarActions>
                  </Toolbar>
                )}

                {children}
              </main>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </>
  );
}
