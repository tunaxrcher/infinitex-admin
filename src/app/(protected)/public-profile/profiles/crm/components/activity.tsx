'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ActivitiesBloggingConference } from 'src/shared/partials/activities/blogging-conference';
import { ActivitiesLogin } from 'src/shared/partials/activities/login';
import { ActivitiesNewProduct } from 'src/shared/partials/activities/new-product';
import { ActivitiesProductSpecific } from 'src/shared/partials/activities/product-specific';
import { ActivitiesProductWebinar } from 'src/shared/partials/activities/product-webinar';
import { Button } from 'src/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'src/shared/components/ui/card';
import { Label } from 'src/shared/components/ui/label';
import { Switch } from 'src/shared/components/ui/switch';

const Activity = () => {
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const handleSwitchToggle = () => {
    setIsSwitchOn(!isSwitchOn);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
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
        <ActivitiesNewProduct />
        <ActivitiesProductWebinar />
        <ActivitiesLogin />
        <ActivitiesBloggingConference
          heading="Email campaign sent to Jenny for a special promotion."
          datetime="1 week ago, 11:45 AM"
          title="First Campaign Created"
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
