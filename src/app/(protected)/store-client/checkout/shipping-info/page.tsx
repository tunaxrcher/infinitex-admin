'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@src/shared/partials/common/toolbar';
import { MapPinned } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { ShippingInfoContent } from '@src/shared/app/(protected)/store-client/checkout/shipping-info/content';
import { Steps } from '@src/shared/app/(protected)/store-client/checkout/steps';

export default function ShippingInfoPage() {
  return (
    <Fragment>
      <Steps currentStep={1} />
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>
              Enter and confirm your delivery address
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline">
              <MapPinned />
              <Link href="#">Add Address</Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <ShippingInfoContent />
      </Container>
    </Fragment>
  );
}
