'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { AccountCompanyProfileContent } from '@src/app/(protected)/account/home/company-profile/content';
import { PageNavbar } from '@src/app/(protected)/account/page-navbar';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@src/app/components/partials/common/toolbar';
import { Container } from '@src/shared/components/common/container';
import { Button } from '@src/shared/components/ui/button';
import { useSettings } from '@src/shared/providers/settings-provider';

export default function AccountCompanyProfilePage() {
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
                Central Hub for Personal Customization
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <Button variant="outline">
                <Link href="#">Public Profile</Link>
              </Button>
              <Button>
                <Link href="#">Billing</Link>
              </Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <AccountCompanyProfileContent />
      </Container>
    </Fragment>
  );
}
