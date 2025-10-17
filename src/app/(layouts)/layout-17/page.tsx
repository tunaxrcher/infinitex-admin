'use client';

import { Toolbar } from '@src/shared/components/layouts/layout-17/components/toolbar';
import { Skeleton } from '@src/shared/components/ui/skeleton';

export default function Page() {
  return (
    <div className="container-fluid">
      <Toolbar />
      <Skeleton className="rounded-lg grow h-screen"></Skeleton>
    </div>
  );
}