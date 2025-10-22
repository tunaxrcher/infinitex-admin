'use client';

import { Users } from '@src/app/(protected)/network/user-table/app-roster/components/users';
import { Faq } from '@src/app/components/partials/common/faq';
import { Help2 } from '@src/app/components/partials/common/help2';

export function NetworkAppRosterContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Users />
      <Faq />
      <Help2 />
    </div>
  );
}
