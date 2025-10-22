'use client';

import Link from 'next/link';
import { DropdownMenu5 } from '@src/app/components/partials/dropdown-menu/dropdown-menu-5';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@src/shared/components/ui/avatar';
import { Button } from '@src/shared/components/ui/button';
import { toAbsoluteUrl } from '@src/shared/lib/helpers';
import { EllipsisVertical, LucideIcon } from 'lucide-react';

interface IHeadingProps {
  author: string;
  avatar: {
    image?: string;
    fallback?: string;
    icon?: LucideIcon;
    iconClass?: string;
    badgeClass?: string;
    className?: string;
    imageClass?: string;
  };
  date: string;
}

const Heading = ({ author, avatar, date }: IHeadingProps) => {
  return (
    <div className="flex justify-between items-center mb-5 p-7.5 pb-0">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage
            src={toAbsoluteUrl(`/media/avatars/${avatar.image}`)}
            alt="image"
          />
          <AvatarFallback>CH</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <Link
            href="#"
            className="text-base font-medium text-mono hover:text-primary-active mb-1"
          >
            {author}
          </Link>
          <time className="text-sm text-secondary-foreground">{date}</time>
        </div>
      </div>
      <DropdownMenu5
        trigger={
          <Button variant="ghost" mode="icon">
            <EllipsisVertical />
          </Button>
        }
      />
    </div>
  );
};

export { Heading, type IHeadingProps };
