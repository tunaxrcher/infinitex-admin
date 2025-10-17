'use client';

import { Container } from 'src/shared/components/common/container';
import { NavbarMenu } from './navbar-menu';

const Navbar = () => {
  return (
    <div className="bg-bg-background border-y border-border mb-5 lg:mb-8">
      <Container className="flex flex-wrap justify-between items-center gap-2">
        <NavbarMenu />
      </Container>
    </div>
  );
};

export { Navbar };
