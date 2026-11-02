'use client';

import { classNames } from '@packages/styles/classNames';
import { Slot } from '@radix-ui/react-slot';
import React, { cloneElement, isValidElement, type ReactNode } from 'react';

import { Menu } from '../Menu';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- the row's look, colored for the frame in SidebarMenu.css.
import { menuItem } from '../Menu/Menu.css';
import { Tooltip } from '../Tooltip';
import { useTruncation } from '../Truncate';
import { useIconAddon } from '../utils';

import { sidebarMenu, sidebarMenuItem } from './SidebarMenu.css';

import type {
  SidebarMenuItemProps,
  SidebarMenuProps,
} from './SidebarMenu.types';

/**
 * A sidebar's navigation: a fixed `header` and `footer`, such as the create
 * action and the account, with the list of SidebarMenuItems between them,
 * which scrolls when it is taller than the room left. It fills the height its
 * sidebar gives it, so the sidebar sets that height: the one under the app's
 * header. Named with `aria-label`, like "Dashboards".
 *
 * @invalidAlternative aside:has(nav, ul)
 */
export const SidebarMenu = ({ className, ...props }: SidebarMenuProps) => (
  <Menu
    role="navigation"
    {...props}
    className={classNames(sidebarMenu, 'flex-col-gap-3', className)}
  />
);

/**
 * A row of the SidebarMenu that opens a route: an anchor with `href`, or
 * with `asChild` its one child, a link component such as the app's NextLink,
 * which keeps its `href` and gives its text as the label. The current page's
 * row is `selected`. A label too long for the row is cut, with the whole of
 * it in a tooltip.
 */
export const SidebarMenuItem = ({
  leftIcon,
  rightAddOn,
  selected = false,
  asChild = false,
  className,
  children,
  ...props
}: SidebarMenuItemProps) => {
  const {
    ref: labelRef,
    className: labelClassName,
    truncated,
  } = useTruncation<HTMLSpanElement>();
  const { leftSlot, rightSlot } = useIconAddon({ leftIcon, rightAddOn });

  const child =
    asChild && isValidElement<{ children?: ReactNode }>(children)
      ? children
      : undefined;
  const label = child ? child.props.children : children;
  const row = (
    <>
      {leftSlot}
      <span
        ref={labelRef}
        data-slot="label"
        data-ds=""
        className={classNames(labelClassName, 'flex-fill-x')}
      >
        {label}
      </span>
      {rightSlot}
    </>
  );
  const rowProps = {
    ...props,
    'aria-current': selected ? ('page' as const) : undefined,
    'data-slot': 'item',
    'data-selected': selected || undefined,
    'data-left': leftSlot ? true : undefined,
    'data-right': rightSlot ? true : undefined,
    className: classNames(
      menuItem,
      sidebarMenuItem,
      'flex-row-gap-2.5 items-center',
      className,
    ),
  };

  return (
    // The whole label shows only when the row cut it; the link's text names it already.
    <Tooltip tooltip={truncated && label} description={null}>
      {child ? (
        <Slot {...rowProps}>{cloneElement(child, undefined, row)}</Slot>
      ) : (
        <a {...rowProps} data-ds="">
          {row}
        </a>
      )}
    </Tooltip>
  );
};
