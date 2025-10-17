'use client';

import { Fragment, useState } from 'react';
import { UserHero } from '@src/shared/partials/common/user-hero';
import { DropdownMenu9 } from '@src/shared/partials/dropdown-menu/dropdown-menu-9';
import { Navbar, NavbarActions } from '@src/shared/partials/navbar/navbar';
import {
  EllipsisVertical,
  Luggage,
  Mail,
  MessageSquareText,
  Users,
} from 'lucide-react';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { Button } from '@src/shared/components/ui/button';
import { Container } from '@src/shared/components/common/container';
import { AccountSettingsModal } from '@src/shared/app/(protected)/account/home/settings-modal/content';
import { PageMenu } from '@src/shared/app/(protected)/public-profile/page-menu';

export default function AccountSettingsModalPage() {
  const [settingsModalOpen, setSettingsModalOpen] = useState(true);
  const handleSettingsModalClose = () => {
    setSettingsModalOpen(false);
  };

  const image = (
    <img
      src={toAbsoluteUrl('/media/avatars/300-1.png')}
      className="rounded-full border-3 border-green-500 max-h-[100px] max-w-full"
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
              <Users /> Connect
            </Button>
            <Button mode="icon" variant="outline">
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
        <AccountSettingsModal
          open={settingsModalOpen}
          onOpenChange={handleSettingsModalClose}
        />
      </Container>
    </Fragment>
  );
}
