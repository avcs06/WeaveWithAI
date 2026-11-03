'use client';

import { classNames } from '@packages/styles/classNames';
import { Avatar } from '@packages/ui/Avatar';
import { Button, PlainButton } from '@packages/ui/Button';
import { Dropdown } from '@packages/ui/Dropdown';
import { Truncate } from '@packages/ui/Truncate';
import { LogOut } from 'lucide-react';
import React from 'react';

import { NextLink } from '../NextLink';

import type { UserMenuProps } from './UserMenu.types';

/**
 * The account in a header or a sidebar. Signed in, it shows the user's avatar
 * and name, and opens a menu: the name, the rows passed as children, then
 * Sign out. Signed out, it shows a Sign in button. It shows nothing while the
 * saved session is read.
 */
export const UserMenu = ({
  user,
  placement,
  onSignOut,
  signInHref,
  children,
  variant,
  size,
  look,
  className,
}: UserMenuProps) => {
  if (user === undefined) return null;

  if (user === null)
    return (
      <Button
        as={NextLink}
        href={signInHref}
        variant={variant}
        size={size}
        look={look}
        className={className}
      >
        Sign in
      </Button>
    );

  const inSidebar = placement === 'sidebar';
  return (
    <Dropdown
      side={inSidebar ? 'right' : 'bottom'}
      menu={
        <>
          <Dropdown.Group label={user.name} />
          {children}
          <Dropdown.Separator />
          <Dropdown.Item leftIcon={<LogOut />} onSelect={onSignOut}>
            Sign out
          </Dropdown.Item>
        </>
      }
    >
      <PlainButton
        aria-label={`Account menu for ${user.name}`}
        className={className}
      >
        <span
          className={classNames(
            'flex-row-gap-2 items-center',
            inSidebar && 'w-full',
          )}
        >
          <Avatar name={user.name} src={user.avatarUrl} />
          <Truncate>{user.name}</Truncate>
        </span>
      </PlainButton>
    </Dropdown>
  );
};
