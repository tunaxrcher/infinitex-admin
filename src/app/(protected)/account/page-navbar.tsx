'use client';

import { Navbar } from 'src/shared/partials/navbar/navbar';
import { NavbarMenu } from 'src/shared/partials/navbar/navbar-menu';
import { MENU_SIDEBAR } from 'src/shared/config/menu.config';
import { useSettings } from 'src/shared/providers/settings-provider';
import { Container } from 'src/shared/components/common/container';

const PageNavbar = () => {
  const { settings } = useSettings();
  const accountMenuConfig = MENU_SIDEBAR?.['3']?.children;

  if (accountMenuConfig && settings?.layout === 'demo1') {
    return (
      <Navbar>
        <Container>
          <NavbarMenu items={accountMenuConfig} />
        </Container>
      </Navbar>
    );
  } else {
    return <></>;
  }
};

export { PageNavbar };
