import type { IconAddonProps, SetByComponent } from '../utils';
import type {
  ComponentPropsWithRef,
  JSXElementConstructor,
  ReactNode,
} from 'react';

export type MenuProps = ComponentPropsWithRef<'div'> &
  /** Set from `loading`. */
  SetByComponent<'aria-busy'> & {
    /** The shell's element: `aside` for a sidebar, which keeps its own role and gives the menu's role and name to the list. */
    as?: 'div' | 'aside';
    /** The height left where the menu opens, a CSS length; caps its height. */
    availableHeight?: string;
    loading?: boolean;
    /** Above the list and outside the menu, like a search field. */
    header?: ReactNode;
    /** Below the list and outside the menu, like a sidebar's account row; it keeps its place while the list scrolls. */
    footer?: ReactNode;
  };

/** A row's element: a `div`, or for a row that opens a page `a` or a link component such as the app's NextLink. */
export type MenuItemTarget = 'div' | 'a' | JSXElementConstructor<never>;

type MenuItemTargetProps<C extends MenuItemTarget> = C extends 'div' | 'a'
  ? ComponentPropsWithRef<C>
  : C extends JSXElementConstructor<infer Props>
    ? Props
    : never;

type MenuItemOwnProps = Pick<
  IconAddonProps,
  'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn' | 'loading'
> &
  /** Set from `loading`, and from `selected` as the role has it. */
  SetByComponent<
    'aria-busy' | 'aria-selected' | 'aria-checked' | 'aria-current'
  > & {
    /** Left out on a row with no checked state, like an action. */
    selected?: boolean;
    /** A checkbox before a row with a checked state, ticked when selected. */
    checkbox?: boolean;
    /** The check mark at the end of a selected row; on by default. */
    checkmark?: boolean;
    /** Shows the chevron of a row that opens a submenu. */
    nested?: boolean;
    /** Shown on hover after the cut label, such as a disabled reason. */
    tooltip?: ReactNode;
  };

/**
 * Inside the components, props already checked by the public types are only
 * passed through.
 */
export type MenuItemBaseProps = MenuItemOwnProps & {
  as?: MenuItemTarget;
  role?: string;
  className?: string;
  children?: ReactNode;
  [prop: string]: unknown;
};

export type MenuItemProps<C extends MenuItemTarget = 'div'> = {
  /** Renders the row as `a` with `href`, or as a link component; selected, it is the current page. */
  as?: C;
} & Omit<MenuItemTargetProps<C>, keyof MenuItemOwnProps | 'as'> &
  MenuItemOwnProps;

export type MenuGroupProps = ComponentPropsWithRef<'div'>;

export type MenuLabelProps = ComponentPropsWithRef<'div'>;

export type MenuSeparatorProps = ComponentPropsWithRef<'div'>;
