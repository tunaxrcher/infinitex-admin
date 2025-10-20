'use client';

import { NavbarMenu } from '@src/app/components/partials/navbar/navbar-menu';
import { MENU_SIDEBAR } from '@src/shared/config/menu.config';

const PageMenu = () => {
  const accountMenuConfig = MENU_SIDEBAR?.['2']?.children;

  if (accountMenuConfig) {
    return <NavbarMenu items={accountMenuConfig} />;
  } else {
    return <></>;
  }
};

export { PageMenu };
