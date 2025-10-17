'use client';

import { useLayout } from '@src/shared/components/layouts/layout-20/components/context';
import { HeaderTitle } from '@src/shared/components/layouts/layout-20/components/header-title';
import { Skeleton } from '@src/shared/components/ui/skeleton';

export default function Page() {
  const { isMobile } = useLayout();

  return (
    <div className="container-fluid">
      {isMobile && <HeaderTitle />}
      <Skeleton className="rounded-lg grow h-screen"></Skeleton>
    </div>
  );
}