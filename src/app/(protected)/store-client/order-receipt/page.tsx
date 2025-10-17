'use client';

import { Container } from '@src/shared/components/common/container';
import { OrderReceiptContent } from '@src/shared/app/(protected)/store-client/order-receipt/content';

export default function OrderReceiptPage() {
  return (
    <Container>
      <OrderReceiptContent />
    </Container>
  );
}
