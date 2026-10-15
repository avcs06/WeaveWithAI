'use client';

import React, { forwardRef } from 'react';

import type { DisabledState } from '../Button';

export type DropdownRowContent = {
  label: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};
export type DropdownItemData = DropdownRowContent &
  DisabledState & {
    type: 'item';
    key: string;
    onSelect?: (event: Event) => void;
  };
export type DropdownGroupData<T> = {
  type: 'group';
  key: string;
  label?: string;
  items: readonly DropdownEntry<T>[];
};
export type DropdownSubMenuData<T> = DropdownRowContent &
  DisabledState & {
    type: 'submenu';
    key: string;
    items: readonly DropdownEntry<T>[];
  };
export type DropdownSeparatorData = { type: 'separator'; key: string };
export type DropdownEntry<T> =
  | T
  | DropdownGroupData<T>
  | DropdownSubMenuData<T>
  | DropdownSeparatorData;
export type DropdownItemProps = DisabledState &
  Omit<Partial<DropdownRowContent>, 'label'> & {
    label?: string;
    children?: React.ReactNode;
    onSelect?: (event: Event) => void;
  };
export type DropdownGroupProps = { label?: string; children: React.ReactNode };
export type DropdownSubMenuProps = {
  children: React.ReactElement<DropdownItemProps, typeof DropdownItem>;
  menu: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
export type DropdownSource<T> =
  | {
      items: readonly DropdownEntry<DropdownItemData>[];
      itemRenderer?: never;
      menu?: never;
    }
  | {
      items: readonly DropdownEntry<T>[];
      itemRenderer: (
        item: T,
      ) => React.ReactElement<DropdownItemProps, typeof DropdownItem>;
      menu?: never;
    }
  | { menu: React.ReactNode; items?: never; itemRenderer?: never };
export type DropdownProps<T> = DisabledState &
  DropdownSource<T> & {
    children: React.ReactElement;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    'aria-label'?: string;
  };

// Intentionally empty: contract tests define the implementation target.
const DropdownItem = forwardRef<HTMLDivElement, DropdownItemProps>(() => null);
const DropdownGroup = forwardRef<HTMLDivElement, DropdownGroupProps>(
  () => null,
);
const DropdownSeparator = forwardRef<HTMLDivElement>(() => null);
const DropdownSubMenu = forwardRef<HTMLDivElement, DropdownSubMenuProps>(
  () => null,
);
DropdownItem.displayName = 'Dropdown.Item';
DropdownGroup.displayName = 'Dropdown.Group';
DropdownSeparator.displayName = 'Dropdown.Separator';
DropdownSubMenu.displayName = 'Dropdown.SubMenu';
export function Dropdown<T>(_props: DropdownProps<T>) {
  return null;
}
Dropdown.Item = DropdownItem;
Dropdown.Group = DropdownGroup;
Dropdown.Separator = DropdownSeparator;
Dropdown.SubMenu = DropdownSubMenu;
