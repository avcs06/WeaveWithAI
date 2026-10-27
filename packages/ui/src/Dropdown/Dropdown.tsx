'use client';

import React, { type ReactNode } from 'react';

import { DropdownButton } from './auxiliary';
import {
  DropdownCheckboxItem,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownRoot,
  DropdownSearch,
  DropdownSeparator,
  DropdownSubMenu,
  DropdownTrigger,
} from './primitives';

import type { DropdownItemProps, DropdownProps } from './Dropdown.types';

const DropdownInner = ({
  children,
  menu,
  align,
  ...rootProps
}: DropdownProps) => (
  <DropdownRoot {...rootProps} closeOnTab>
    <DropdownTrigger>{children}</DropdownTrigger>
    <DropdownContent align={align}>{menu}</DropdownContent>
  </DropdownRoot>
);

// The row's roles and `nested` are for the parts and components built on it.
const Item: (props: DropdownItemProps) => ReactNode = DropdownItem;

/**
 * A menu of actions or choices behind a trigger button: row actions, an
 * account menu, sort by, view options. Menu roles, focus and keyboard built in.
 *
 * @invalidAlternative import('@radix-ui/react-dropdown-menu')
 * @invalidAlternative [role="menu"], [aria-haspopup="menu"], [aria-haspopup="true"]
 * @invalidAlternative div[role="menuitem"], li[role="menuitem"], button[role="menuitem"], a[role="menuitem"], span[role="menuitem"]
 * @invalidAlternative div[role="menuitemcheckbox"], li[role="menuitemcheckbox"], button[role="menuitemcheckbox"]
 * @invalidAlternative div[role="menuitemradio"], li[role="menuitemradio"], button[role="menuitemradio"]
 */
export const Dropdown = Object.assign(DropdownInner, {
  Item,
  CheckboxItem: DropdownCheckboxItem,
  RadioGroup: DropdownRadioGroup,
  RadioItem: DropdownRadioItem,
  Group: DropdownGroup,
  Separator: DropdownSeparator,
  SubMenu: DropdownSubMenu,
  Search: DropdownSearch,
  Button: DropdownButton,
});
