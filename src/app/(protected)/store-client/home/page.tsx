'use client';

import { Container } from '@src/shared/components/common/container';
import { StoreClientContent } from '@src/app/(protected)/store-client/home/content';

export default function StoreClientPage() {
  return (
    <Container>
      <StoreClientContent />
    </Container>
  );
}
