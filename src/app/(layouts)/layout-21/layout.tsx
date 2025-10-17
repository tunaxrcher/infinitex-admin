'use client';

import { Layout21 } from '@src/shared/components/layouts/layout-21';
import { ReactNode, useEffect, useState } from 'react';

import { ScreenLoader } from '@src/shared/components/screen-loader';

export default function Layout({children}: {children: ReactNode}) {
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
    <Layout21>
      {children}
    </Layout21>
  );
}
