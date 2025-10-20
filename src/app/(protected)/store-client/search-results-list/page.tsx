'use client';

import { Container } from '@src/shared/components/common/container';
import { SearchResultsListContent } from '@src/app/(protected)/store-client/search-results-list/content';

export default function SearchResultsListPage() {
  return (
    <Container>
      <SearchResultsListContent />
    </Container>
  );
}
