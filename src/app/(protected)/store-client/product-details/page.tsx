'use client';

import { Container } from '@src/shared/components/common/container';
import { ProductDetailsContent } from '@src/shared/app/(protected)/store-client/product-details/content';

export default function ProductDetailsPage() {
  return (
    <Container>
      <ProductDetailsContent />
    </Container>
  );
}
