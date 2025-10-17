'use client';

import { Fragment } from 'react';
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
import { NetworkSocialContent } from 'src/shared/app/(protected)/network/user-cards/social/content';

export default function NetworkSocialPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
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
              <Button variant="outline">Upload CSV</Button>
              <Button variant="primary">Add User</Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <NetworkSocialContent />
      </Container>
    </Fragment>
  );
}
