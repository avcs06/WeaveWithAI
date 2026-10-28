'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Dropdown's primitives, for components built on Dropdown.
import {
  type DropdownContentProps,
  type DropdownItemRowProps,
} from '../Dropdown/Dropdown.types';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Dropdown's primitives, for components built on Dropdown.
import { DropdownContent, DropdownItem } from '../Dropdown/primitives';
import { LoadingIcon } from '../Icons';

import { selectMenu, selectMenuMessage } from './Select.css';

type SelectMenuProps = DropdownContentProps & {
  multiple: boolean;
  loading: boolean;
};

export const SelectMenu = ({
  multiple,
  loading,
  className,
  ...props
}: SelectMenuProps) => (
  <DropdownContent
    {...props}
    role="listbox"
    aria-multiselectable={multiple || undefined}
    loading={loading}
    align="start"
    className={classNames(selectMenu, className)}
  />
);

type SelectOptionRowProps = DropdownItemRowProps & { selected: boolean };

export const SelectOptionRow = (props: SelectOptionRowProps) => (
  <DropdownItem {...props} role="option" />
);

export const SelectMenuMessage = ({
  loading,
  children,
}: {
  loading: boolean;
  children: string;
}) =>
  children && (
    <div
      // The Select's status region announces it.
      aria-hidden
      data-slot="message"
      className={classNames(
        selectMenuMessage,
        'flex-row-gap-2 items-center justify-center py-4 px-3',
      )}
    >
      {loading && <LoadingIcon className="icon-size-label shrink-0" />}
      {children}
    </div>
  );
