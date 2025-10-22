'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ActivitiesAnniversary } from '@src/app/components/partials/activities/anniversary';
import { ActivitiesBloggingConference } from '@src/app/components/partials/activities/blogging-conference';
import { ActivitiesInterview } from '@src/app/components/partials/activities/interview';
import { ActivitiesFollowersMilestone } from '@src/app/components/partials/activities/milestone';
import { ActivitiesNewArticle } from '@src/app/components/partials/activities/new-article';
import { ActivitiesUpcomingContent } from '@src/app/components/partials/activities/upcoming-content';
import { Button } from '@src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { Label } from '@src/shared/components/ui/label';
import { Switch } from '@src/shared/components/ui/switch';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';

const Activities = () => {
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const handleSwitchToggle = () => {
    setIsSwitchOn(!isSwitchOn);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activities</CardTitle>
        <div className="flex items-center space-x-2.5">
          <Label htmlFor="simple-switch" className="text-sm">
            Auto refresh:
          </Label>
          {isSwitchOn ? 'On' : 'Off'}
          <Switch
            id="simple-switch"
            size="sm"
            className="ms-2"
            checked={isSwitchOn}
            onCheckedChange={handleSwitchToggle}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ActivitiesNewArticle />
        <ActivitiesInterview />
        <ActivitiesUpcomingContent />
        <ActivitiesBloggingConference
          image={
            <Fragment>
              <img
                src={toAbsoluteUrl(`/media/illustrations/3.svg`)}
                className="dark:hidden max-h-[160px]"
                alt="image"
              />
              <img
                src={toAbsoluteUrl(`/media/illustrations/3-dark.svg`)}
                className="light:hidden max-h-[160px]"
                alt="image"
              />
            </Fragment>
          }
        />
        <ActivitiesFollowersMilestone />
        <ActivitiesAnniversary />
      </CardContent>
      <CardFooter className="justify-center">
        <Button mode="link" underlined="dashed" asChild>
          <Link href="/public-profile/activity">All-time Activities</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { Activities };
