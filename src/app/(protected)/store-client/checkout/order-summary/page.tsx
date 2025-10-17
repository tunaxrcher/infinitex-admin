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
import { BaggageClaim } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { OrderSummaryContent } from '@src/shared/app/(protected)/store-client/checkout/order-summary/content';
import { Steps } from '@src/shared/app/(protected)/store-client/checkout/steps';

export default function OrderSummaryPage() {
  return (
    <Fragment>
      <Steps currentStep={0} />
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>
              Review your items before checkout
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline">
              <BaggageClaim />
              <Link href="#">View Cart</Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <OrderSummaryContent />
      </Container>
    </Fragment>
  );
}
