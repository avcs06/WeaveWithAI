'use client';

import React from 'react';

export type DisabledState =
  | { disabledReason: string; disabled?: never }
  | { disabled?: boolean; disabledReason?: never };

export type ButtonOwnProps = DisabledState & {
  size?: 'sm' | 'md' | 'icon-xs' | 'icon-sm' | 'icon-md';
  variant?: 'default' | 'base' | 'ghost' | 'danger';
  rounded?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddOn?: React.ReactNode;
  rightAddOn?: React.ReactNode;
  tooltip?: React.ReactNode;
  loading?: boolean;
  disableWhileLoading?: boolean;
  readOnly?: boolean;
  readOnlyReason?: string;
  loadingReason?: string;
};

export type ButtonProps<C extends React.ElementType = 'button'> =
  ButtonOwnProps & { as?: C } & Omit<
      React.ComponentPropsWithRef<NoInfer<C>>,
      keyof ButtonOwnProps | 'as'
    >;

export type IconButtonProps<C extends React.ElementType = 'button'> = Omit<
  ButtonOwnProps,
  'size'
> & { as?: C; size?: 'xs' | 'sm' | 'md' } & Omit<
    React.ComponentPropsWithRef<NoInfer<C>>,
    keyof ButtonOwnProps | 'as'
  >;

// Intentionally empty: contract tests define the implementation target.
export function Button<C extends React.ElementType = 'button'>(
  _props: ButtonProps<C>,
) {
  return null;
}
export function IconButton<C extends React.ElementType = 'button'>(
  _props: IconButtonProps<C>,
) {
  return null;
}
export const DropdownButton = Button;
export const PopoverButton = Button;
export const PlainButton = Button;
