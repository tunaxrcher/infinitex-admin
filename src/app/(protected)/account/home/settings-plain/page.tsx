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
import { AccountSettingsPlainContent } from 'src/shared/app/(protected)/account/home/settings-plain/content';
import { PageNavbar } from 'src/shared/app/(protected)/account/page-navbar';

export default function AccountSettingsPlainPage() {
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
                Clean, Efficient User Experience
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">Public Profile</Link>
              </Button>
              <Button>
                <Link href="#">Get Started</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountSettingsPlainContent />
      </Container>
    </Fragment>
  );
}
