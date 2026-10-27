import type { ButtonProps, ButtonTarget } from '../Button';
import type { DisabledProps, DisabledState, LoadingState } from '../utils';
import type { ReactElement, ReactNode } from 'react';

/** Disabled or loading, as controls are; a popover has no read-only state. */
export type PopoverStateProps = DisabledState &
  LoadingState & {
    disableWhileLoading?: boolean;
  };

// The content is a dialog, named for what it holds.
type AccessibleName =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

export type PopoverProps = PopoverStateProps & {
  /** One trigger element that forwards refs, events and attributes. */
  children: ReactElement;
  /** The content, with its own padding and layout. */
  menu: ReactNode;
  /** Defaults to `end`. */
  align?: 'start' | 'end';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Keeps focus in the content and blocks the page while open; `false` by
   * default.
   */
  modal?: boolean;
  /** For the content, which renders outside the trigger's parent. */
  menuClassName?: string;
} & AccessibleName;

/** Its disabled and loading state come from the Popover. */
export type PopoverButtonProps<C extends ButtonTarget = 'button'> = Omit<
  ButtonProps<C>,
  keyof DisabledProps | 'size'
> & {
  size?: 'sm' | 'md';
};
