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
import { AccountPermissionsCheckContent } from 'src/shared/app/(protected)/account/members/permissions-check/content';
import { PageNavbar } from 'src/shared/app/(protected)/account/page-navbar';

export default function AccountPermissionsCheckPage() {
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
                Overview of all team members and roles.
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">View Roles</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountPermissionsCheckContent />
      </Container>
    </Fragment>
  );
}
