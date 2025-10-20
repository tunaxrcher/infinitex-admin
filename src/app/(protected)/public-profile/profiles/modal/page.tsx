'use client';

import { Fragment } from 'react';
import { UserHero } from '@src/app/components/partials/common/user-hero';
import { DropdownMenu9 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-9';
import { Navbar, NavbarActions } from '@src/app/components/partials/navbar/navbar';
import {
  EllipsisVertical,
  Luggage,
  Mail,
  MessagesSquare,
  Users,
} from 'lucide-react';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { PageMenu } from '@src/app/(protected)/public-profile/page-menu';
import { ProfileModalContent } from '@src/app/(protected)/public-profile/profiles/modal/content';

export default function ProfileModalPage() {
  const image = (
    <img
      src={toAbsoluteUrl('/media/avatars/300-1.png')}
      className="rounded-full border-3 border-green-500 size-[100px] shrink-0"
      alt="image"
    />
  );

  return (
    <Fragment>
      <UserHero
        name="Jenny Klabber"
        image={image}
        info={[
          { label: 'KeenThemes', icon: Luggage },
          { label: '', icon: null },
          { email: 'jenny@kteam.com', icon: Mail },
        ]}
      />
      <Container>
        <Navbar>
          <PageMenu />
          <NavbarActions>
            <Button>
              <Users /> Follow
            </Button>
            <Button variant="outline" mode="icon">
              <MessagesSquare />
            </Button>
            <DropdownMenu9
              trigger={
                <Button variant="outline" mode="icon">
                  <EllipsisVertical />
                </Button>
              }
            />
          </NavbarActions>
        </Navbar>
      </Container>
      <ProfileModalContent />
    </Fragment>
  );
}
