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
import { NetworkAppRosterContent } from 'src/shared/app/(protected)/network/user-table/app-roster/content';

export default function NetworkAppRosterPage() {
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
              <Button variant="outline">Import CSV</Button>
              <Button variant="primary">Add Member</Button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <NetworkAppRosterContent />
      </Container>
    </Fragment>
  );
}
