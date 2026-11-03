'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { Menu, MenuItemBase } from '../Menu';

import { sidebarMenu, sidebarMenuItem } from './SidebarMenu.css';

import type {
  SidebarMenuItemProps,
  SidebarMenuItemTarget,
  SidebarMenuProps,
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
    className={classNames(sidebarMenu, 'gap-1.5', className)}
  />
);

/**
 * A row of the SidebarMenu that opens a route: a MenuItem as an anchor with
 * `href`, or with `as` a link component such as the app's NextLink. The
 * current page's row is `selected`. A label too long for the row is cut,
 * with the whole of it in a tooltip.
 */
export const SidebarMenuItem = <C extends SidebarMenuItemTarget = 'a'>({
  className,
  ...props
}: SidebarMenuItemProps<C>) => (
  <MenuItemBase
    // An anchor unless `as` gives a link component.
    as="a"
    // The current page shows by its fill, not a check.
    checkmark={false}
    {...props}
    className={classNames(sidebarMenuItem, className)}
  />
);
