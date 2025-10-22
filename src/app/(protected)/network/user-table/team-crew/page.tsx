'use client';

import { Fragment } from 'react';
import { NetworkUserTableTeamCrewContent } from '@src/app/(protected)/network/user-table/team-crew/content';
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

export default function NetworkUserTableTeamCrewPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                <div className="flex items-center flex-wrap gap-1.5 font-medium">
                  <span className="text-base text-secondary-foreground">
                    All Members:
                  </span>
                  <span className="text-base text-foreground font-medium me-2">
                    49,053
                  </span>
                  <span className="text-base text-secondary-foreground">
                    Pro Licenses
                  </span>
                  <span className="text-base text-foreground font-medium">
                    724
                  </span>
                </div>
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
        <NetworkUserTableTeamCrewContent />
      </Container>
    </Fragment>
  );
}
