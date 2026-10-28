'use client';

import { classNames } from '@packages/styles/classNames';
import { composeHandlers, stopPropagation } from '@packages/utils/events';
import { ChevronDown, X } from 'lucide-react';
import React, {
  type AriaAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { IconButton } from '../Button';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- shared styles for the icon at the end of a trigger.
import { controlIcon } from '../Button/Button.recipes.css';
// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Dropdown's primitives, for components built on Dropdown.
import { useMenuSearch } from '../Dropdown/primitives';
import { ControlBox, type ControlBoxProps } from '../FormControl';
import { BareInput } from '../Input';
import { Tag } from '../Tag';
import { Truncate } from '../Truncate';
import { mergeRefs } from '../utils';

import {
  selectLineBox,
  selectPlaceholder,
  selectSearch,
  selectTrigger,
} from './Select.css';

import type { SelectOptionData } from './Select.types';

type SelectTriggerProps = ControlBoxProps & {
  // Radix's trigger is a button; this box is a div, which takes neither.
  type?: string;
  disabled?: boolean;
  // A div has no name: react-hook-form holds the value.
  name?: string;
};

export const SelectTrigger = ({
  type,
  disabled,
  name,
  className,
  ...props
}: SelectTriggerProps) => (
  <ControlBox {...props} className={classNames(selectTrigger, className)} />
);

type SelectValueProps = {
  selected: SelectOptionData[];
  multiple: boolean;
  placeholder: string;
  disabled: boolean;
  onRemove: (value: string, tag: HTMLElement) => void;
  onTagKeyDown: (event: KeyboardEvent<HTMLElement>, value: string) => void;
};

export const SelectValue = ({
  selected,
  multiple,
  placeholder,
  disabled,
  onRemove,
  onTagKeyDown,
}: SelectValueProps) => {
  if (selected.length === 0) {
    return <Truncate className={selectPlaceholder}>{placeholder}</Truncate>;
  }

  if (!multiple) return <Truncate>{selected[0].label}</Truncate>;

  return selected.map(({ value, label }) => (
    <Tag
      key={value}
      data-slot="tag"
      size="xs"
      closable
      closeTabIndex={-1}
      disabled={disabled}
      onClose={(event) => onRemove(value, event.currentTarget)}
      onKeyDown={(event) => onTagKeyDown(event, value)}
    >
      {label}
    </Tag>
  ));
};

/** State the search field carries while it shows. */
export type SelectFieldAria = Pick<
  AriaAttributes,
  'aria-describedby' | 'aria-invalid' | 'aria-required' | 'aria-keyshortcuts'
>;

type SelectSearchFieldProps = SelectFieldAria & {
  ref: Ref<HTMLInputElement>;
  label: string | undefined;
  menuId: string;
  text: string;
  placeholder: string | undefined;
  onTextChange: (text: string) => void;
  onKeyDownWhenEmpty: (key: string) => void;
  /** Chooses the first enabled option listed. */
  onEnter: () => void;
};

/**
 * The editable combobox (ARIA 1.2) while the menu is open; the box only
 * groups it with the values.
 */
export const SelectSearchField = ({
  ref,
  label,
  menuId,
  text,
  placeholder,
  onTextChange,
  onKeyDownWhenEmpty,
  onEnter,
  ...fieldAria
}: SelectSearchFieldProps) => {
  const search = useMenuSearch();

  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      // Prevents a form submit; stopped too, as a prevented key skips the
      // search's own handler.
      event.preventDefault();
      event.stopPropagation();
      onEnter();
    } else if (text === '') {
      // Not prevented: the search's own handler stops the key first.
      onKeyDownWhenEmpty(event.key);
    }
  };

  return (
    <BareInput
      ref={mergeRefs(ref, search.ref)}
      {...fieldAria}
      role="combobox"
      aria-label={label ? `Search ${label}` : 'Search'}
      aria-expanded
      aria-controls={menuId}
      aria-autocomplete="list"
      autoComplete="off"
      value={text}
      placeholder={placeholder}
      onChange={onTextChange}
      onKeyDown={composeHandlers(keyDown, search.onKeyDown)}
      // A press in the field places the caret; it doesn't toggle the menu.
      onPointerDown={stopPropagation}
      className={classNames(selectSearch, 'grow p-0')}
    />
  );
};

export const SelectEnd = ({
  size,
  atTop,
  onClear,
}: {
  size: ControlBoxProps['size'];
  atTop: boolean;
  onClear: (() => void) | undefined;
}) => {
  const iconClassName = controlIcon({ size });
  return (
    <span
      className={classNames(
        selectLineBox,
        'inline-flex-row-gap-1 items-center shrink-0',
        atTop ? 'self-start' : 'self-end',
      )}
    >
      {onClear && (
        <IconButton
          variant="base"
          look="ghost"
          size="xs"
          tabIndex={-1}
          tooltip="Clear selection"
          onClick={onClear}
        >
          <X />
        </IconButton>
      )}
      <ChevronDown aria-hidden data-slot="chevron" className={iconClassName} />
    </span>
  );
};

export const SelectContent = ({
  value,
  search,
}: {
  value: ReactNode;
  search: ReactNode;
}) => (
  <span
    data-slot="value"
    className="flex-fill-x flex-row-gap-1 flex-wrap items-center"
  >
    {value}
    {search}
  </span>
);
