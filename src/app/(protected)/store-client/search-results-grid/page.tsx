'use client';

import { Container } from '@src/shared/components/common/container';
import { SearchResultsGridContent } from '@src/shared/app/(protected)/store-client/search-results-grid/content';

export default function SearchResultsGridPage() {
  return (
    <Container>
      <SearchResultsGridContent />
    </Container>
  );
}
