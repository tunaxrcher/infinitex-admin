'use client';
'use client';

import { ReactNode } from 'react';
import { TooltipProvider } from '@src/shared/components/ui/tooltip';

export function TooltipsProvider({ children }: { children: ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}
