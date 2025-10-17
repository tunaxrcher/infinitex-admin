'use client';

import { Layout4 } from '@src/shared/components/layouts/layout-4';
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
    <Layout4>
      {children}
    </Layout4>
  );
}
