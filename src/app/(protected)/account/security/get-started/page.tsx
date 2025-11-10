'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { PageNavbar } from '@src/app/(protected)/account/page-navbar';
import { AccountSecurityGetStartedContent } from '@src/app/(protected)/account/security/get-started/content';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@src/app/components/partials/common/toolbar';
import { useSettings } from '@src/shared/providers/settings-provider';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';

export default function AccountSecurityGetStartedPage() {
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondary-foreground">
                    19 issues need your attention
                  </span>
                  <span className="size-0.75 bg-mono/50 rounded-full"></span>
                  <Button mode="link" underlined="dashed" asChild>
                    <Link href="/account/security/security-log">
                      Security Log
                    </Link>
                  </Button>
                </div>
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountSecurityGetStartedContent />
      </Container>
    </Fragment>
  );
}
