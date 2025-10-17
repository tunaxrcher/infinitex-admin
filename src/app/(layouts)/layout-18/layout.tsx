'use client';

import { Layout18 } from '@src/shared/components/layouts/layout-18';
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
    <Layout18>
      {children}
    </Layout18>
  );
}
