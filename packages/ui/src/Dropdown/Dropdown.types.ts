import type { DropdownItem } from './primitives';
import type { ButtonProps, ButtonTarget } from '../Button';
import type { SearchInputProps } from '../Input';
import type {
  MenuGroupProps,
  MenuItemProps,
  MenuProps,
  MenuSeparatorProps,
} from '../Menu';
import type {
  DisabledProps,
  DisabledState,
  LoadingState,
  SetByComponent,
} from '../utils';
import type * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type {
  ComponentPropsWithRef,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';

declare module '@radix-ui/react-dropdown-menu' {
  interface DropdownMenuContentProps {
    /**
     * Radix passes it on to the menu's focus scope, but leaves it out of
     * these props. Preventing it keeps focus where the handler put it.
     */
    onOpenAutoFocus?: (event: Event) => void;
  }
}

/** Disabled or loading, as controls are; a menu has no read-only state. */
type DropdownStateProps = DisabledState &
  LoadingState & {
    disableWhileLoading?: boolean;
  };

type DropdownOpenProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
};

/** How the rows with a checked state show it, for every row of the menu. */
type IndicatorProps = {
  /** A checkbox before each row with a checked state. */
  showCheckbox?: boolean;
  /** A check mark after each checked row; on by default. */
  showCheckmark?: boolean;
};

export type DropdownRootProps = DropdownStateProps &
  DropdownOpenProps &
  IndicatorProps & {
    /** Tab closes the menu, back to the trigger, as a menu of actions does. */
    closeOnTab?: boolean;
    children: ReactNode;
  };

export type DropdownContentProps = ComponentPropsWithRef<
  typeof DropdownMenu.Content
> &
  Pick<MenuProps, 'loading'>;

export type DropdownProps = DropdownStateProps &
  DropdownOpenProps &
  IndicatorProps & {
    /**
     * One trigger element that forwards refs, events and attributes:
     * `Dropdown.Button`, an `IconButton`… The Dropdown's reason reaches it as
     * `disabledWithReason` or `loadingWithReason`, for its own tooltip.
     */
    children: ReactElement<DisabledProps>;
    menu: ReactNode;
    /** Defaults to `end`. */
    align?: 'start' | 'end';
  };

export type DropdownItemProps = Omit<
  MenuItemProps,
  | 'onSelect'
  | 'tooltip'
  | 'loading'
  | 'nested'
  | 'role'
  | 'selected'
  | 'checkbox'
  | 'checkmark'
> &
  DropdownStateProps &
  /** Set from the disabled state. */
  SetByComponent<'aria-disabled'> & {
    /**
     * Marks the current one, like the view in use; announced as current. An
     * on/off row is a CheckboxItem, one choice of several a RadioItem.
     */
    selected?: boolean;
    /** The text typeahead matches; needed when the children aren't text. */
    textValue?: string;
    /** Runs once on activation; preventing its default keeps the menu open. */
    onSelect?: (event: Event) => void;
  };

/**
 * Also the rows of components built on Dropdown, like a Select's options,
 * and a SubMenu's trigger, which it marks `nested`.
 */
export type DropdownItemRowProps = DropdownItemProps & {
  role?: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' | 'option';
  nested?: boolean;
};

export type DropdownCheckboxItemProps = Omit<DropdownItemProps, 'selected'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export type DropdownRadioItemProps = Omit<DropdownItemProps, 'selected'> & {
  value: string;
};

export type DropdownGroupProps = MenuGroupProps &
  /** Set from `label`. */
  SetByComponent<'aria-labelledby'> & {
    /** Drawn as a MenuLabel that labels the group. */
    label?: string;
  };

export type DropdownRadioGroupProps = DropdownGroupProps & {
  /** The checked item's value. */
  value: string;
  onValueChange: (value: string) => void;
};

export type DropdownSeparatorProps = MenuSeparatorProps;

export type DropdownSubMenuProps = DropdownStateProps & {
  /** The trigger: exactly one `Dropdown.Item`; the SubMenu's state shows on it. */
  children: ReactElement<DropdownItemProps, typeof DropdownItem>;
  menu: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Reaches the trigger's row. */
  ref?: Ref<HTMLDivElement>;
};

export type DropdownSearchProps = SearchInputProps;

/** Its disabled and loading state come from the Dropdown. */
export type DropdownButtonProps<C extends ButtonTarget = 'button'> = Omit<
  ButtonProps<C>,
  keyof DisabledProps | 'size'
> & {
  size?: 'sm' | 'md';
};
