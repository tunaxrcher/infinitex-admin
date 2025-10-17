'use client';

import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@src/shared/layouts/demo1/components/toolbar';
import { useSettings } from '@src/shared/providers/settings-provider';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { AccountPlansContent } from '@src/shared/app/(protected)/account/billing/plans/content';
import { PageNavbar } from '@src/shared/app/(protected)/account/page-navbar';

export default function AccountPlansPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading
              title="Plans"
              description="Central Hub for Personal Customization"
            />
            <ToolbarActions>
              <Button variant="outline">View Billing</Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountPlansContent />
      </Container>
    </Fragment>
  );
}
