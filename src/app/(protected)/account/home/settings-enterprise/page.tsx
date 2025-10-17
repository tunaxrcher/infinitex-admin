'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from 'src/shared/partials/common/toolbar';
import { useSettings } from 'src/shared/providers/settings-provider';
import { Button } from 'src/shared/components/ui/button';
import { Container } from 'src/shared/components/common/container';
import { AccountSettingsEnterpriseContent } from 'src/shared/app/(protected)/account/home/settings-enterprise/content';
import { PageNavbar } from 'src/shared/app/(protected)/account/page-navbar';

export default function AccountSettingsEnterprisePage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Tailored Tools for Business Scalability
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">Public Profile</Link>
              </Button>
              <Button>
                <Link href="#">My profile</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountSettingsEnterpriseContent />
      </Container>
    </Fragment>
  );
}
