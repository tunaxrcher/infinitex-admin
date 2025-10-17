'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
} from 'src/shared/partials/common/toolbar';
import { useSettings } from 'src/shared/providers/settings-provider';
import { Button } from 'src/shared/components/ui/button';
import { Container } from 'src/shared/components/common/container';
import { PageNavbar } from 'src/shared/app/(protected)/account/page-navbar';
import { AccountSecurityLogContent } from 'src/shared/app/(protected)/account/security/security-log/content';

export default function AccountSecurityLogPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      <PageNavbar />
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <span className="text-sm text-secondary-foreground">
                  Authorized Devices for Report Access
                </span>
                <span className="size-0.75 bg-mono/50 rounded-full"></span>
                <Button mode="link" underlined="dashed" asChild>
                  <Link href="#">Unlink All Devices</Link>
                </Button>
              </div>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">Security Overview</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountSecurityLogContent />
      </Container>
    </Fragment>
  );
}
