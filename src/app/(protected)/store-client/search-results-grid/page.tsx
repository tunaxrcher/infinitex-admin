'use client';

import { SearchResultsGridContent } from '@src/app/(protected)/store-client/search-results-grid/content';
import { Container } from '@src/shared/components/common/container';

export default function SearchResultsGridPage() {
  return (
    <Container>
      <SearchResultsGridContent />
    </Container>
  );
}
