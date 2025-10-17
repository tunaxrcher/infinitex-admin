'use client';

import { Container } from '@src/shared/components/common/container';
import { SearchResultsListContent } from '@src/shared/app/(protected)/store-client/search-results-list/content';

export default function SearchResultsListPage() {
  return (
    <Container>
      <SearchResultsListContent />
    </Container>
  );
}
