import type { MenuItemProps, MenuItemTarget, MenuProps } from '../Menu';
import type { AccessibleName } from '../utils';
import type { ComponentPropsWithRef } from 'react';

/** Menu's shell as an `aside`, without a menu's role or height cap, named for assistive tech. */
export type SidebarMenuProps = Omit<
  MenuProps,
  'as' | 'role' | 'availableHeight' | 'loading' | 'aria-busy'
> &
  AccessibleName;

/** A row's element: a link, `a` with `href` or a link component such as the app's NextLink, or `div` for a row of the header or footer. */
export type SidebarMenuItemTarget = MenuItemTarget;

/** A MenuItem that is a link; `selected` marks the page the user is on. */
export type SidebarMenuLinkProps<C extends SidebarMenuItemTarget> = Omit<
  MenuItemProps<C>,
  | 'role'
  | 'rightIcon'
  | 'leftAddOn'
  | 'loading'
  | 'checkbox'
  | 'checkmark'
  | 'nested'
  | 'tooltip'
>;

/** A row of the sidebar's `header` or `footer` around one piece, such as the logo, a button or the account menu. */
export type SidebarMenuRowProps = ComponentPropsWithRef<'div'> & { as: 'div' };

export type SidebarMenuItemProps<C extends SidebarMenuItemTarget = 'a'> =
  C extends 'div' ? SidebarMenuRowProps : SidebarMenuLinkProps<C>;
