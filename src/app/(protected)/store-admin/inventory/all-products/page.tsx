'use client';

import { Container } from 'src/shared/components/common/container';
import { AllProductsContent } from 'src/shared/app/(protected)/store-admin/inventory/all-products/content';

export default function AllProductsPage() {
  return (
    <Container>
      <AllProductsContent />
    </Container>
  );
}
