'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { AccountRolesContent } from '@src/app/(protected)/account/members/roles/content';
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

export default function AccountRolesPage() {
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
                <Link href="#">New Role</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountRolesContent />
      </Container>
    </Fragment>
  );
}
