'use client';

import { Fragment } from 'react';
import { CampaignsContent } from '@src/app/(protected)/public-profile/campaigns/card/content';
import { PageMenu } from '@src/app/(protected)/public-profile/page-menu';
import { UserHero } from '@src/app/components/partials/common/user-hero';
import { DropdownMenu9 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-9';
import {
  Navbar,
  NavbarActions,
} from '@src/app/components/partials/navbar/navbar';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import {
  EllipsisVertical,
  Mail,
  MapPin,
  MessagesSquare,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';

export default function CampaignsCardPage() {
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
          { label: 'KeenThemes', icon: Zap },
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
        <CampaignsContent mode="cards" />
      </Container>
    </Fragment>
  );
}
