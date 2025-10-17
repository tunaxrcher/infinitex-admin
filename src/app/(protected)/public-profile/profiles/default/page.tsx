'use client';

import { Fragment } from 'react';
import { UserHero } from 'src/shared/partials/common/user-hero';
import { DropdownMenu9 } from 'src/shared/partials/dropdown-menu/dropdown-menu-9';
import { Navbar, NavbarActions } from 'src/shared/partials/navbar/navbar';
import {
  EllipsisVertical,
  Luggage,
  Mail,
  MapPin,
  MessageSquareText,
  Users,
} from 'lucide-react';
import { toAbsoluteUrl } from 'src/shared/lib/helpers';
import { Button } from 'src/shared/components/ui/button';
import { Container } from 'src/shared/components/common/container';
import { PageMenu } from 'src/shared/app/(protected)/public-profile/page-menu';
import { ProfileDefaultContent } from 'src/shared/app/(protected)/public-profile/profiles/default/content';

export default function ProfileDefaultPage() {
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
          { label: 'SF, Bay Area', icon: MapPin },
          { email: 'jenny@kteam.com', icon: Mail },
        ]}
      />
      <Container>
        <Navbar>
          <PageMenu />
          <NavbarActions>
            <Button>
              <Users /> Connect
            </Button>
            <Button variant="outline" mode="icon">
              <MessageSquareText />
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
      <Container>
        <ProfileDefaultContent />
      </Container>
    </Fragment>
  );
}
