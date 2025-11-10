'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { AccountImportMembersContent } from '@src/app/(protected)/account/members/import-members/content';
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

export default function AccountImportMembersPage() {
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
                <Link href="#">Go to Teams</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountImportMembersContent />
      </Container>
    </Fragment>
  );
}
