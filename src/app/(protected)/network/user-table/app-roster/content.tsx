'use client';

import { Faq } from 'src/shared/partials/common/faq';
import { Help2 } from 'src/shared/partials/common/help2';
import { Users } from 'src/shared/app/(protected)/network/user-table/app-roster/components/users';

export function NetworkAppRosterContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <Users />
      <Faq />
      <Help2 />
    </div>
  );
}
