'use client';

import { SearchResultsListContent } from '@src/app/(protected)/store-client/search-results-list/content';
import { Container } from '@src/shared/components/common/container';

export default function SearchResultsListPage() {
  return (
    <Container>
      <SearchResultsListContent />
    </Container>
  );
}
