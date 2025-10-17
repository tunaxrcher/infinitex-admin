'use client';

import { Fragment } from 'react';
import { UserHero } from '@src/shared/partials/common/user-hero';
import { DropdownMenu9 } from '@src/shared/partials/dropdown-menu/dropdown-menu-9';
import { Navbar, NavbarActions } from '@src/shared/partials/navbar/navbar';
import {
  EllipsisVertical,
  Mail,
  MapPin,
  MessagesSquare,
  SquareMousePointer,
  Users,
  Volleyball,
} from 'lucide-react';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { PageMenu } from '@src/shared/app/(protected)/public-profile/page-menu';
import { ProfileCreatorContent } from '@src/shared/app/(protected)/public-profile/profiles/creator/content';

export default function ProfileCreatorPage() {
  const image = (
    <div className="flex items-center justify-center rounded-full border-2 border-red-200 bg-background size-[100px] shrink-0">
      <img
        src={toAbsoluteUrl('/media/brand-logos/inferno.svg')}
        className="size-11"
        alt="image"
      />
    </div>
  );

  return (
    <Fragment>
      <UserHero
        name="Inferno"
        image={image}
        info={[
          { label: 'inferno.com', icon: Volleyball },
          { label: 'SF, Bay Area', icon: MapPin },
          { email: 'jenny@kteam.com', icon: Mail },
        ]}
      />
      <Container>
        <Navbar>
          <PageMenu />
          <NavbarActions>
            <Button>
              <SquareMousePointer /> Hire Us
            </Button>
            <Button variant="outline">
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
      <Container>
        <ProfileCreatorContent />
      </Container>
    </Fragment>
  );
}
