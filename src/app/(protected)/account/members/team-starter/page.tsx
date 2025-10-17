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
import { AccountTeamsStarterContent } from 'src/shared/app/(protected)/account/members/team-starter/content';
import { PageNavbar } from 'src/shared/app/(protected)/account/page-navbar';

export default function AccountTeamsStarterPage() {
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
                Efficient team organization with real-time updates
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">Plans</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountTeamsStarterContent />
      </Container>
    </Fragment>
  );
}
