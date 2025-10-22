'use client';

import { StoreClientContent } from '@src/app/(protected)/store-client/home/content';
import { Container } from '@src/shared/components/common/container';

export default function StoreClientPage() {
  return (
    <Container>
      <StoreClientContent />
    </Container>
  );
}
