'use client';

import { classNames } from '@packages/styles/classNames';
import { composeHandlers } from '@packages/utils/events';
import { useControlledValue } from '@packages/utils/hooks';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import React, {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { SearchInput } from '../Input';
import { Menu, MenuGroup, MenuItem, MenuLabel, MenuSeparator } from '../Menu';
import { type DisabledProps, mergeRefs, useIsDisabled } from '../utils';

import {
  DropdownProvider,
  RadioGroupProvider,
  useDropdown,
  useRadioGroup,
} from './context';
import { searchMessage } from './Dropdown.css';
import {
  backsOutOfItems,
  enabledItems,
  entryItem,
  isInMenu,
  isTypingKey,
} from './focus';

import type {
  DropdownCheckboxItemProps,
  DropdownContentProps,
  DropdownGroupProps,
  DropdownItemRowProps,
  DropdownRadioGroupProps,
  DropdownRadioItemProps,
  DropdownRootProps,
  DropdownSearchProps,
  DropdownSeparatorProps,
  DropdownSubMenuProps,
} from './Dropdown.types';

// Between the trigger and the menu, and kept from the viewport's edges.
const sideOffset = 4;
const collisionPadding = 8;
// Radix sets it on the menu it places: a menu never outgrows the space left.
const availableHeight = 'var(--radix-dropdown-menu-content-available-height)';

/**
 * Open state and the disabled rule: a disabled dropdown, or a loading one,
 * shows no menu, even controlled open, and keeps the caller's value for when
 * it's enabled again.
 */
export const DropdownRoot = ({
  open,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  closeOnTab = false,
  showCheckbox = false,
  showCheckmark = true,
  children,
  ...state
}: DropdownRootProps) => {
  const searchRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [isOpen, setOpen] = useControlledValue(open, defaultOpen, onOpenChange);
  const { isLoading, isDisabled, stateTooltip } = useIsDisabled(state);

  return (
    <DropdownProvider
      searchRef={searchRef}
      contentRef={contentRef}
      isLoading={isLoading}
      isDisabled={isDisabled}
      stateTooltip={stateTooltip}
      close={() => setOpen(false)}
      closeOnTab={closeOnTab}
      showCheckbox={showCheckbox}
      showCheckmark={showCheckmark}
    >
      <DropdownMenu.Root
        modal={modal}
        open={isOpen && !isDisabled}
        onOpenChange={(next) => {
          if (!isDisabled) setOpen(next);
        }}
      >
        {children}
      </DropdownMenu.Root>
    </DropdownProvider>
  );
};

/**
 * The reason reaches the trigger as its own prop, so the trigger shows it
 * in its one tooltip, under its own text; a tap on a disabled button opens
 * that tooltip, and no second one competes with it. Other props reach the
 * trigger through Radix, like the box state FormControl gives a Select's.
 */
export const DropdownTrigger = ({
  children,
  ...props
}: {
  children: ReactElement<DisabledProps>;
}) => {
  const { isDisabled, isLoading, stateTooltip } = useDropdown();
  // Radix's `disabled` decides whether loading disables the trigger.
  const reason = isLoading
    ? { loadingWithReason: stateTooltip, disableWhileLoading: false }
    : { disabledWithReason: stateTooltip };

  return (
    <DropdownMenu.Trigger asChild {...props} disabled={isDisabled}>
      {stateTooltip ? cloneElement(children, reason) : children}
    </DropdownMenu.Trigger>
  );
};

/** Children with fragments opened, so a search field passed in one is found. */
const flattenFragments = (node: ReactNode): ReactNode[] =>
  Children.toArray(node).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenFragments(child.props.children)
      : [child],
  );

const isSearch = (node: ReactNode) =>
  isValidElement(node) && node.type === DropdownSearch;

/**
 * The menu, in Menu's look.
 *
 * Focus with a search field (Dropdown.Search, or a Select's):
 * - Opening the menu focuses the search field, not the first row.
 * - In the field, keys edit the text and reach nothing else. ArrowDown and
 *   Tab move to the rows: the first selected one, else the first
 *   (`useMenuSearch`).
 * - On a row, a character key moves focus to the field in the capture
 *   phase, before the key's default action: the character is typed into
 *   the field instead of jumping to a row by typeahead. Space still chooses
 *   the row.
 * - Shift+Tab on any row, or ArrowUp on the first, goes back to the field.
 *
 * Without a search field, focus is Radix's: the first row on open, then
 * arrows, Home, End and typeahead. With `closeOnTab` on the root, Tab on a
 * row closes the menu and focus goes back to the trigger; otherwise Tab
 * stays in the menu, as a Select's does.
 */
export const DropdownContent = ({
  ref,
  align = 'end',
  loading,
  className,
  onOpenAutoFocus,
  onKeyDownCapture,
  onKeyDown,
  children,
  ...props
}: DropdownContentProps) => {
  const { searchRef, contentRef, close, closeOnTab } = useDropdown();

  const nodes = flattenFragments(children);
  const search = nodes.filter(isSearch);
  const rows = nodes.filter((node) => !isSearch(node));

  const focusSearch = (event: Event) => {
    const search = searchRef?.current;
    if (!search) return;
    event.preventDefault();
    search.focus();
  };

  const typeIntoSearch = (event: KeyboardEvent<HTMLDivElement>) => {
    const search = searchRef?.current;
    if (!search || event.target === search) return;
    if (!isInMenu(event) || !isTypingKey(event)) return;
    event.stopPropagation();
    search.focus();
  };

  const backToSearch = (event: KeyboardEvent<HTMLDivElement>) => {
    const search = searchRef?.current;
    if (!search || !isInMenu(event)) return;
    if (!backsOutOfItems(event, event.currentTarget)) return;
    event.preventDefault();
    search.focus();
  };

  const leaveRows = (event: KeyboardEvent<HTMLDivElement>) => {
    backToSearch(event);
    if (event.defaultPrevented || !closeOnTab) return;
    if (event.key === 'Tab' && isInMenu(event)) close();
  };

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        asChild
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        {...props}
        onOpenAutoFocus={composeHandlers(onOpenAutoFocus, focusSearch)}
        onKeyDownCapture={composeHandlers(onKeyDownCapture, typeIntoSearch)}
        onKeyDown={composeHandlers(onKeyDown, leaveRows)}
      >
        <Menu
          ref={mergeRefs(ref, contentRef)}
          availableHeight={availableHeight}
          loading={loading}
          // The search field sits above the rows, outside the menu.
          header={search.length > 0 ? search : undefined}
          className={classNames('z-dropdown', className)}
        >
          {rows}
        </Menu>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
};

type ItemRowProps = Omit<DropdownItemRowProps, 'textValue' | 'onSelect'>;

/**
 * A MenuItem with an item's states: disabled or loading, with the reason,
 * and how the menu shows a checked row.
 */
const ItemRow = ({
  disabled,
  disabledWithReason,
  loading,
  loadingWithReason,
  disableWhileLoading,
  onClick,
  children,
  ...props
}: ItemRowProps) => {
  const { showCheckbox, showCheckmark } = useDropdown();
  const { isLoading, isDisabled, stateTooltip } = useIsDisabled({
    disabled,
    disabledWithReason,
    loading,
    loadingWithReason,
    disableWhileLoading,
  });

  return (
    <MenuItem
      {...props}
      checkbox={showCheckbox}
      checkmark={showCheckmark}
      loading={isLoading}
      tooltip={stateTooltip}
      // Not Radix's `disabled`, which takes the row out of the arrow keys:
      // a disabled row stays reachable, so its reason is.
      aria-disabled={isDisabled || undefined}
      data-disabled={isDisabled || undefined}
      // Blocked while disabled; the prevented click shows the reason.
      onClick={(event) => {
        if (isDisabled) event.preventDefault();
        else onClick?.(event);
      }}
    >
      {children}
    </MenuItem>
  );
};

/**
 * A MenuItem with menu behavior. `Dropdown.SubMenu` sets `nested` on its
 * trigger: the same row then opens the submenu instead.
 */
export const DropdownItem = ({
  textValue,
  onSelect,
  nested = false,
  ...props
}: DropdownItemRowProps) =>
  nested ? (
    <DropdownMenu.SubTrigger asChild textValue={textValue}>
      <ItemRow {...props} nested />
    </DropdownMenu.SubTrigger>
  ) : (
    <DropdownMenu.Item asChild textValue={textValue} onSelect={onSelect}>
      <ItemRow {...props} />
    </DropdownMenu.Item>
  );

/** An on/off row, announced as checked or not. */
export const DropdownCheckboxItem = ({
  checked,
  onCheckedChange,
  textValue,
  onSelect,
  ...props
}: DropdownCheckboxItemProps) => (
  <DropdownMenu.CheckboxItem
    asChild
    checked={checked}
    onCheckedChange={onCheckedChange}
    textValue={textValue}
    onSelect={onSelect}
  >
    <ItemRow {...props} role="menuitemcheckbox" selected={checked} />
  </DropdownMenu.CheckboxItem>
);

/** One choice of a `Dropdown.RadioGroup`, announced as checked or not. */
export const DropdownRadioItem = ({
  value,
  textValue,
  onSelect,
  ...props
}: DropdownRadioItemProps) => {
  const { checkedValue } = useRadioGroup();
  return (
    <DropdownMenu.RadioItem
      asChild
      value={value}
      textValue={textValue}
      onSelect={onSelect}
    >
      <ItemRow
        {...props}
        role="menuitemradio"
        selected={checkedValue === value}
      />
    </DropdownMenu.RadioItem>
  );
};

export const DropdownGroup = ({
  label,
  children,
  ...props
}: DropdownGroupProps) => {
  const labelId = useId();
  return (
    <DropdownMenu.Group asChild aria-labelledby={label ? labelId : undefined}>
      <MenuGroup {...props}>
        {label && (
          <DropdownMenu.Label asChild>
            <MenuLabel id={labelId}>{label}</MenuLabel>
          </DropdownMenu.Label>
        )}
        {children}
      </MenuGroup>
    </DropdownMenu.Group>
  );
};

/** Rows of which one is checked: `Dropdown.RadioItem`s, with a label. */
export const DropdownRadioGroup = ({
  value,
  onValueChange,
  ...props
}: DropdownRadioGroupProps) => (
  <RadioGroupProvider checkedValue={value}>
    <DropdownMenu.RadioGroup
      asChild
      value={value}
      onValueChange={onValueChange}
    >
      <DropdownGroup {...props} />
    </DropdownMenu.RadioGroup>
  </RadioGroupProvider>
);

export const DropdownSeparator = (props: DropdownSeparatorProps) => (
  <DropdownMenu.Separator asChild>
    <MenuSeparator {...props} />
  </DropdownMenu.Separator>
);

const assertSubMenuTrigger = (trigger: unknown) => {
  if (process.env.NODE_ENV === 'production') return;
  if (isValidElement(trigger) && trigger.type === DropdownItem) return;
  throw new Error('Dropdown.SubMenu: its trigger should be a Dropdown.Item');
};

/**
 * A nested menu, opened by its trigger `Dropdown.Item`. Disabled or loading,
 * as a Dropdown is, it never opens and keeps the caller's open value for when
 * it's enabled again.
 */
export const DropdownSubMenu = ({
  children,
  menu,
  open,
  defaultOpen = false,
  onOpenChange,
  ref,
  ...state
}: DropdownSubMenuProps) => {
  assertSubMenuTrigger(children);
  const { close, closeOnTab } = useDropdown();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useControlledValue(open, defaultOpen, onOpenChange);
  const { isDisabled } = useIsDisabled(state);

  return (
    <DropdownMenu.Sub
      open={isOpen && !isDisabled}
      onOpenChange={(next) => {
        if (!isDisabled) setOpen(next);
      }}
    >
      {/* The SubMenu's state shows on its trigger, as a Dropdown's does. */}
      {cloneElement<DropdownItemRowProps>(children, {
        ...state,
        nested: true,
        ref: mergeRefs(children.props.ref, ref, triggerRef),
      })}
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent
          asChild
          collisionPadding={collisionPadding}
          // One level back, as ArrowLeft goes, not out of every menu.
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
          }}
          onKeyDown={(event) => {
            if (closeOnTab && event.key === 'Tab') close();
          }}
        >
          <Menu availableHeight={availableHeight} className="z-dropdown">
            {menu}
          </Menu>
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
};

/** The search field's part of the menu's focus (see `DropdownContent`). */
export const useMenuSearch = () => {
  const { searchRef, contentRef } = useDropdown();

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    const menu = contentRef?.current;

    // With text typed, Enter chooses the first match, not the selected row a
    // multiple choice would unselect. A form around the field never submits.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (menu && event.currentTarget.value) enabledItems(menu)[0]?.click();
      return;
    }

    const toItems =
      event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey);
    const item = toItems && menu && entryItem(menu);
    if (!item) return;
    event.preventDefault();
    item.focus();
  };

  return { ref: searchRef, onKeyDown };
};

export const DropdownSearch = ({
  ref,
  onKeyDown,
  ...props
}: DropdownSearchProps) => {
  const { contentRef } = useDropdown();
  const search = useMenuSearch();
  const [count, setCount] = useState<number>();

  // The rows left however the caller filters them, synchronously or not.
  useEffect(() => {
    const menu = contentRef?.current;
    if (!menu) return;
    const countRows = () =>
      setCount(menu.querySelectorAll('[data-slot="item"]').length);
    countRows();
    const observer = new MutationObserver(countRows);
    observer.observe(menu, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [contentRef]);

  const isSearching = props.value !== '' && count !== undefined;
  const isEmpty = isSearching && count === 0;
  const results = count === 1 ? '1 result' : `${count} results`;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    search.onKeyDown(event);
    if (event.key === 'Tab') event.preventDefault();
  };

  return (
    <>
      <div data-slot="search" className="mx-1.5 py-1">
        <SearchInput
          {...props}
          ref={mergeRefs(ref, search.ref)}
          onKeyDown={composeHandlers(onKeyDown, handleKeyDown)}
        />
        {/* In the menu: a modal menu hides everything else from assistive
            tech, live regions too. */}
        <span role="status" className="sr-only">
          {isSearching && (isEmpty ? 'No matches' : results)}
        </span>
      </div>
      {isEmpty && (
        <div
          // The status announces it.
          aria-hidden
          data-slot="message"
          className={classNames(searchMessage, 'py-4 px-3 text-center')}
        >
          No matches
        </div>
      )}
    </>
  );
};
