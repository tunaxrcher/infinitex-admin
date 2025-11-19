'use client';

import { Container } from '@src/shared/components/common/container';
import { PopularSettings, Search, SettingLists } from './components';

export default function StoreClientPage() {
  return (
    <Container>
      <div className="grid grid-cols-1 gap-6">
        <Search />
        <SettingLists />
        <PopularSettings />
      </div>
    </Container>
  );
}
