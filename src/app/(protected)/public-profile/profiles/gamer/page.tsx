'use client';

import { Fragment } from 'react';
import { PageMenu } from '@src/app/(protected)/public-profile/page-menu';
import { ProfileGamerContent } from '@src/app/(protected)/public-profile/profiles/gamer/content';
import { UserHero } from '@src/app/components/partials/common/user-hero';
import { DropdownMenu9 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-9';
import {
  Navbar,
  NavbarActions,
} from '@src/app/components/partials/navbar/navbar';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import {
  EllipsisVertical,
  MapPin,
  MessagesSquare,
  ScanEye,
  SquarePlus,
  Twitch,
  Users,
} from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';

export default function ProfileGamerPage() {
  const image = (
    <img
      src={toAbsoluteUrl('/media/avatars/300-27.png')}
      className="rounded-full border-3 border-green-500 size-[100px] shrink-0"
      alt="image"
    />
  );

  return (
    <Fragment>
      <UserHero
        name="Floyd Miles"
        image={image}
        info={[
          { label: 'SF, Bay Area', icon: MapPin },
          { label: 'floydgg', icon: Twitch },
          { email: 'Level 22', icon: ScanEye },
        ]}
      />
      <Container>
        <Navbar>
          <PageMenu />
          <NavbarActions>
            <Button>
              <Users /> Connect
            </Button>
            <Button variant="outline">
              <SquarePlus /> Invite to Team
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
      <Container>
        <ProfileGamerContent />
      </Container>
    </Fragment>
  );
}
