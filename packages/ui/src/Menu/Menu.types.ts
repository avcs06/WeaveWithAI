import type { IconAddonProps, SetByComponent } from '../utils';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export type MenuProps = ComponentPropsWithRef<'div'> &
  /** Set from `loading`. */
  SetByComponent<'aria-busy'> & {
    /** The height left where the menu opens, a CSS length; caps its height. */
    availableHeight?: string;
    loading?: boolean;
    /** Above the list and outside the menu, like a search field. */
    header?: ReactNode;
  };

export type MenuItemProps = ComponentPropsWithRef<'div'> &
  Pick<
    IconAddonProps,
    'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn' | 'loading'
  > &
  /** Set from `loading`, and from `selected` as the role has it. */
  SetByComponent<
    'aria-busy' | 'aria-selected' | 'aria-checked' | 'aria-current'
  > & {
    /** Left out on a row with no checked state, like an action. */
    selected?: boolean;
    /** A checkbox before the row that has a checked state, ticked when selected. */
    checkbox?: boolean;
    /** The check mark at the end of a selected row; on by default. */
    checkmark?: boolean;
    /** Shows the chevron of a row that opens a submenu. */
    nested?: boolean;
    /** Shown on hover after the cut label, such as a disabled reason. */
    tooltip?: ReactNode;
  };

export type MenuGroupProps = ComponentPropsWithRef<'div'>;

export type MenuLabelProps = ComponentPropsWithRef<'div'>;

export type MenuSeparatorProps = ComponentPropsWithRef<'div'>;
