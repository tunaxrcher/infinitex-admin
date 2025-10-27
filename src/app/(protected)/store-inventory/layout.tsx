'use client';

import { useEffect, useState } from 'react';
import { DefaultLayout } from '@src/shared/components/layouts/store-inventory';
import { LayoutProvider } from '@src/shared/components/layouts/store-inventory/components/context';
import { ScreenLoader } from '@src/shared/components/screen-loader';

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate short loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1 second loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ScreenLoader />;
  }

  return (
    <LayoutProvider>
      <DefaultLayout>{children}</DefaultLayout>
    </LayoutProvider>
  );
}
