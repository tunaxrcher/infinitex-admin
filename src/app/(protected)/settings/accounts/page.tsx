'use client';

import { AccountLogsSection } from '@src/features/land-accounts/components/account-logs-section';
import { CreateAccountDialog } from '@src/features/land-accounts/components/create-account-dialog';
import { LandAccountsSection } from '@src/features/land-accounts/components/land-accounts-section';
import { Plus } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { useState } from 'react';

export default function AccountSettingsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <Container>
      <div className="container-fluid space-y-5 lg:space-y-9">
        <div className="flex items-center flex-wrap dap-2.5 justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="gradientText text-xl font-bold text-foreground">
              ตั้งค่าบัญชี
            </h1>
            <span className="text-sm text-muted-foreground">
              จัดการบัญชีและประวัติการทำรายการ
            </span>
          </div>
          <div className="flex items-center gap-3">
             <Button
              variant="mono"
              className="gap-2 gradientButton"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มบัญชี
            </Button>
          </div>
        </div>

        {/* Section 1: Land Accounts */}
        <LandAccountsSection />

        <div className="flex items-center flex-wrap justify-between mb-5">
          <div className="flex flex-col gap-1">
            <h1 className="gradientText text-xl font-bold text-foreground">
              ประวัติการทำรายการ
            </h1>
            <span className="text-sm text-muted-foreground">
              แสดงประวัติการทำรายการทั้งหมดของบัญชี
            </span>
          </div>
        </div>

        {/* Section 2: Account Logs */}
        <AccountLogsSection />

        {/* Create Product Modal */}
        <CreateAccountDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </Container>
  );
}
