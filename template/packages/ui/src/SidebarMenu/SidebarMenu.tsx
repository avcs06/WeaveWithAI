'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { Menu, MenuItemBase } from '../Menu';

import {
  sidebarMenu,
  sidebarMenuItem,
  sidebarMenuRow,
} from './SidebarMenu.css';

import type {
  SidebarMenuItemProps,
  SidebarMenuItemTarget,
  SidebarMenuLinkProps,
  SidebarMenuProps,
  SidebarMenuRowProps,
} from './SidebarMenu.types';

/**
 * A sidebar's navigation: a fixed `header` and `footer`, such as a logo, a
 * search or a Create button above and the account below, with the list of
 * SidebarMenuItems between them, which scrolls when it is taller than the
 * room left. It fills the height its
 * sidebar gives it, so the sidebar sets that height: the one under the app's
 * header. Named with `aria-label`, like "Dashboards".
 */
export const SidebarMenu = ({ className, ...props }: SidebarMenuProps) => (
  <Menu
    as="aside"
    role="navigation"
    {...props}
    className={classNames(sidebarMenu, className)}
  />
);

/**
 * A row of the SidebarMenu that opens a route: a MenuItem as an anchor with
 * `href`, or with `as` a link component such as the app's NextLink. The
 * current page's row is `selected`. A label too long for the row is cut,
 * with the whole of it in a tooltip. With `as="div"` it is a row of the
 * `header` or `footer` around one piece, such as the logo or the account
 * menu, which lines the piece up with the links.
 */
export const SidebarMenuItem = <C extends SidebarMenuItemTarget = 'a'>(
  props: SidebarMenuItemProps<C>,
) => {
  // The public type already matched the props to `as`.
  if (props.as === 'div') {
    const { as: _as, className, ...rowProps } = props as SidebarMenuRowProps;
    return (
      <div
        {...rowProps}
        data-ds=""
        className={classNames(
          sidebarMenuRow,
          'flex-row-gap-2.5 items-center',
          className,
        )}
      />
    );
  }

  const { className, ...linkProps } = props as SidebarMenuLinkProps<C>;
  return (
    <MenuItemBase
      // An anchor unless `as` gives a link component.
      as="a"
      // The current page shows by its fill, not a check.
      checkmark={false}
      {...linkProps}
      className={classNames(sidebarMenuItem, className)}
    />
  );
};
