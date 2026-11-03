import type { MenuItemProps, MenuItemTarget, MenuProps } from '../Menu';
import type { AccessibleName } from '../utils';

/** Menu's shell as an `aside`, without a menu's role or height cap, named for assistive tech. */
export type SidebarMenuProps = Omit<
  MenuProps,
  'as' | 'role' | 'availableHeight' | 'loading' | 'aria-busy'
> &
  AccessibleName;

/** A row's link: `a` with `href`, or a link component such as the app's NextLink. */
export type SidebarMenuItemTarget = Exclude<MenuItemTarget, 'div'>;

/** A MenuItem that is a link; `selected` marks the page the user is on. */
export type SidebarMenuItemProps<C extends SidebarMenuItemTarget = 'a'> = Omit<
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
