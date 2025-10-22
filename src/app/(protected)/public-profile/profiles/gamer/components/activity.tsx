'use client';

import { Fragment, useId } from 'react';
import Link from 'next/link';
import { ActivitiesBloggingConference } from '@src/app/components/partials/activities/blogging-conference';
import { ActivitiesLogin } from '@src/app/components/partials/activities/login';
import { ActivitiesNewProduct } from '@src/app/components/partials/activities/new-product';
import { ActivitiesProductSpecific } from '@src/app/components/partials/activities/product-specific';
import { ActivitiesProductWebinar } from '@src/app/components/partials/activities/product-webinar';
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

const Activity = () => {
  const id = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor={id} className="text-sm">
            Auto update
          </Label>
          <Switch id={id} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <ActivitiesNewProduct />
        <ActivitiesProductWebinar />
        <ActivitiesLogin />
        <ActivitiesBloggingConference
          heading="Email campaign sent to Jenny for a special promotion."
          datetime="1 week ago, 11:45 AM"
          title="First Campaign Created"
          image={
            <Fragment>
              <img
                src={toAbsoluteUrl(`/media/illustrations/10.svg`)}
                className="dark:hidden max-h-[160px]"
                alt="image"
              />
              <img
                src={toAbsoluteUrl(`/media/illustrations/10-dark.svg`)}
                className="light:hidden max-h-[160px]"
                alt="image"
              />
            </Fragment>
          }
        />
        <ActivitiesProductSpecific />
      </CardContent>
      <CardFooter className="justify-center">
        <Button mode="link" underlined="dashed" asChild>
          <Link href="/public-profile/activity">All-time Activities</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export { Activity };
