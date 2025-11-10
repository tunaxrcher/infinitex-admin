'use client';

import { AccountEnterpriseContent } from '@src/app/(protected)/account/billing/enterprise/content';
import { PageNavbar } from '@src/app/(protected)/account/page-navbar';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@src/app/components/partials/common/toolbar';
import { useSettings } from '@src/shared/providers/settings-provider';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';

export default function AccountEnterprisePage() {
  const { settings } = useSettings();

  return (
    <>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Advanced Billing Solutions for Large Businesses
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">Order History</Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountEnterpriseContent />
      </Container>
    </>
  );
}
