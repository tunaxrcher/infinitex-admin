'use client';

import { Faq } from '@src/app/components/partials/common/faq';
import { Help } from '@src/app/components/partials/common/help';
import { CurrentSessions } from '@src/app/(protected)/account/security/current-sessions/components/current-sessions';

export function AccountCurrentSessionsContent() {
  return (
    <div className="grid gap-5 lg:gap-7.5">
      <CurrentSessions />
      <Faq />
      <Help />
    </div>
  );
}
