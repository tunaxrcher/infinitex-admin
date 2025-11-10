'use client';

import { Fragment } from 'react';
import { PageMenu } from '@src/app/(protected)/public-profile/page-menu';
import { ProfileCompanyContent } from '@src/app/(protected)/public-profile/profiles/company/content';
import { UserHero } from '@src/app/components/partials/common/user-hero';
import { DropdownMenu9 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-9';
import {
  Navbar,
  NavbarActions,
} from '@src/app/components/partials/navbar/navbar';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import {
  EllipsisVertical,
  Luggage,
  Mail,
  MapPin,
  MessagesSquare,
  Users,
} from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';

export default function ProfileCompanyPage() {
  const image = (
    <div className="flex items-center justify-center rounded-full border-2 border-green-200 size-[100px] shrink-0 bg-background">
      <img
        src={toAbsoluteUrl('/media/brand-logos/duolingo.svg')}
        className="size-[50px]"
        alt="image"
      />
    </div>
  );

  return (
    <Fragment>
      <UserHero
        name="Duolingo"
        image={image}
        info={[
          { label: 'Public Company', icon: Luggage },
          { label: 'Pittsburgh, KS', icon: MapPin },
          { email: 'info@duolingo.com', icon: Mail },
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
      <Container>
        <ProfileCompanyContent />
      </Container>
    </Fragment>
  );
}
