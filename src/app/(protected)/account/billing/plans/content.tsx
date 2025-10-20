'use client';

import { Faq } from '@src/app/components/partials/common/faq';
import { Help } from '@src/app/components/partials/common/help';
import { Plans } from './components';

export function AccountPlansContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Plans />
      <Faq />
      <Help />
    </div>
  );
}
