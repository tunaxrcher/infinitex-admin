'use client';

import { Container } from '@src/shared/components/common/container';
import { AccountLogsSection } from '../components/account-settings/account-logs-section';
import { LandAccountsSection } from '../components/account-settings/land-accounts-section';

export default function AccountSettingsPage() {
  return (
    <Container>
      <div className="container-fluid space-y-5 lg:space-y-9">
        <div className="flex flex-col gap-1">
          <h1 className="gradientText text-xl font-bold text-foreground">
            ตั้งค่าบัญชี
          </h1>
          <span className="text-sm text-muted-foreground">
            จัดการบัญชีและประวัติการทำรายการ
          </span>
        </div>

        {/* Section 1: Land Accounts */}
        <LandAccountsSection />

        {/* Section 2: Account Logs */}
        <AccountLogsSection />
      </div>
    </Container>
  );
}
