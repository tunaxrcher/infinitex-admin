import { useLayout } from './context';
import { Button } from '@src/shared/components/ui/button';
import { useState } from 'react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetBody } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useEffect } from 'react';
import { Navbar } from './navbar';
import { WorkspaceMenu } from './workspace-menu';
import { Logo } from './logo';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function HeaderLogo() {
  const pathname = usePathname();
  const {isMobile} = useLayout();

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Close sheet when route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex items-center gap-5 shrink-0 lg:w-[200px]">
      <div className="flex items-center gap-1">
        {isMobile && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="dim" mode="icon" className="-ms-2.5">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              className="p-2.5 gap-0 w-[200px] dark"
              side="left"
              close={false}
            >
              <SheetHeader className="p-0 space-y-0" />
              <SheetBody className="flex flex-col grow p-0 dark overflow-y-auto">
                <Navbar />
              </SheetBody>
            </SheetContent>
          </Sheet>
        )}
        {/* Brand */}
        <Link href="/layout-35" className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-md border border-[rgba(255,255,255,0.30)] bg-[#007421] bg-[radial-gradient(97.49%_97.49%_at_50%_2.51%,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_100%)] shadow-[0_0_0_1px_#009229]">
            <Logo className="min-w-[16px]" />
          </div>  
        </Link>
      </div>

      <WorkspaceMenu />
    </div>
  );
}
