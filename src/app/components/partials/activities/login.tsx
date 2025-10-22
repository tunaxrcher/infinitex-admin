'use client';

import Link from 'next/link';
import { Button } from '@src/shared/components/ui/button';
import { LogIn } from 'lucide-react';
import { TimelineItem } from './timeline-item';

const ActivitiesLogin = () => {
  return (
    <TimelineItem icon={LogIn} line={true}>
      <div className="flex flex-col">
        <div className="text-sm text-foreground">
          Jenny's last login to the{' '}
          <Button mode="link" asChild>
            <Link href="#">Customer Portal</Link>
          </Button>
        </div>
        <span className="text-xs text-secondary-foreground">
          5 days ago, 4:07 PM
        </span>
      </div>
    </TimelineItem>
  );
};

export { ActivitiesLogin };
