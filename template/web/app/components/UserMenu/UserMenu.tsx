'use client';

import { signOut, useCurrentUser } from '@app/entities/auth';
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
 * The account in a header or a sidebar, from the app's session. Signed in, it
 * shows the user's avatar and name, and opens a menu: the name, the rows
 * passed as children, then Sign out, which signs out. Signed out, it shows a
 * Sign in button. It shows nothing while the saved session is read.
 */
export const UserMenu = ({
  placement,
  signInHref,
  children,
  variant,
  size,
  look,
  className,
}: UserMenuProps) => {
  const session = useCurrentUser();
  if (session === undefined) return null;

  if (session === null)
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
  // The session knows the user by email.
  const name = session.email;
  return (
    <Dropdown
      side={inSidebar ? 'right' : 'bottom'}
      menu={
        <>
          <Dropdown.Group label={name} />
          {children}
          <Dropdown.Separator />
          <Dropdown.Item leftIcon={<LogOut />} onSelect={signOut}>
            Sign out
          </Dropdown.Item>
        </>
      }
    >
      <PlainButton
        aria-label={`Account menu for ${name}`}
        className={className}
      >
        <span
          className={classNames(
            'flex-row-gap-2 items-center',
            inSidebar && 'w-full',
          )}
        >
          <Avatar size="sm" name={name} />
          <Truncate>{name}</Truncate>
        </span>
      </PlainButton>
    </Dropdown>
  );
};
