'use client';

import { Faq } from '@src/app/components/partials/common/faq';
import { Help } from '@src/app/components/partials/common/help';
import { IPAddresses } from './components';

export function AccountAllowedIPAddressesContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <IPAddresses />
      <Faq />
      <Help />
    </div>
  );
}
