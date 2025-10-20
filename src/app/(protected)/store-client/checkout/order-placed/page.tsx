'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@src/app/components/partials/common/toolbar';
import { Captions } from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { OrderPlacedContent } from '@src/app/(protected)/store-client/checkout/order-placed/content';
import { Steps } from '@src/app/(protected)/store-client/checkout/steps';

export default function OrderPlacedPage() {
  return (
    <Fragment>
      <Steps currentStep={3} />
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>
              Your purchase has been successfully completed
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline">
              <Captions />
              <Link href="/store-client/my-orders">My Orders</Link>
            </Button>
            <Button>
              <Captions />
              <Link href="/store-client/my-orders">Continue Shopping</Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
        <OrderPlacedContent />
      </Container>
    </Fragment>
  );
}
