import type { MenuProps } from '../Menu';
import type { AccessibleName, IconAddonProps, SetByComponent } from '../utils';
import type { ComponentPropsWithoutRef } from 'react';

/** Menu's shell without a menu's role or height cap, named for assistive tech. */
export type SidebarMenuProps = Omit<
  MenuProps,
  'role' | 'availableHeight' | 'loading' | 'aria-busy'
> &
  AccessibleName;

export type SidebarMenuItemProps = ComponentPropsWithoutRef<'a'> &
  Pick<IconAddonProps, 'leftIcon' | 'rightAddOn'> &
  /** Set from `selected`. */
  SetByComponent<'aria-current'> & {
    /** The row of the page the user is on, marked `aria-current="page"`. */
    selected?: boolean;
    /**
     * Styles its only child, a link component that takes the `href`, like the
     * app's NextLink; the child's text becomes the row's label.
     */
    asChild?: boolean;
  };
