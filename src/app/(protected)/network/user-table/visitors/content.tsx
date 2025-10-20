'use client';

import { Faq } from '@src/app/components/partials/common/faq';
import { Help2 } from '@src/app/components/partials/common/help2';
import { Visitors } from './components';

export function NetworkVisitorsContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Visitors />
      <Faq />
      <Help2 />
    </div>
  );
}
