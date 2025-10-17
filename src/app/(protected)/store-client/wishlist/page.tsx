'use client';

import { Container } from '@src/shared/components/common/container';
import { WishlistContent } from '@src/shared/app/(protected)/store-client/wishlist/content';

export default function WishlistPage() {
  return (
    <Container>
      <WishlistContent />
    </Container>
  );
}
