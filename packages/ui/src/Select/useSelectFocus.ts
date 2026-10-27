import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useRef,
} from 'react';

// eslint-disable-next-line import-rules/barrel-only-sibling-imports -- Dropdown's primitives, for components built on Dropdown.
import {
  backsOutOfItems,
  entryItem,
  isInMenu,
  isTypingKey,
  menuItems,
} from '../Dropdown/focus';

import { contains, isForwardTab } from './utils';

import type { SelectionControl } from './selectionControl';

type SelectFocusOptions = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isSearchable: boolean;
  isDisabled: boolean;
  selectionControl: SelectionControl;
  canClear: boolean;
  setSearchText: (text: string) => void;
  onBlur: (() => void) | undefined;
  triggerRef: RefObject<HTMLDivElement | null>;
  searchRef: RefObject<HTMLInputElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
};

/** Where focus goes when a key opens the menu, other than Dropdown's own. */
type OpenFocus = 'first' | 'last' | { key: string };

// APG's listbox: a page is 10 options.
const pageSize = 10;

/**
 * Focus moves between the trigger, its search field and the options as one
 * control: one tab stop while closed, and `onBlur` only once focus leaves
 * all three. The keys are the APG select-only combobox's.
 *
 * - Closed, on the trigger: ArrowDown, Enter and Space open the menu on the
 *   selected option, else the first. ArrowUp and Home open it on the first
 *   option, End on the last. A character key opens it with the character
 *   typed into the search field; without one, on the next option that
 *   starts with it, and Dropdown's typeahead goes on from there.
 * - On the trigger, or in an empty search field: Backspace removes the last
 *   value and Delete the first; a single value is cleared by either.
 *   ArrowLeft moves to the last tag.
 * - On a tag: ArrowLeft and ArrowRight move between tags, and past the last
 *   back to the search field or the trigger. Backspace removes the tag and
 *   moves to the one before it, Delete to the one after.
 * - Opening focuses the search field (Dropdown does), else the selected or
 *   first option; an empty menu keeps focus itself.
 * - Open, on the trigger: a character key moves focus to the search field
 *   before the key's default action, so the character lands there.
 *   ArrowDown moves to the options, and so does Tab without a search field;
 *   with one, Tab reaches it on its own.
 * - On the options: with a search field, Dropdown's flow applies (typing,
 *   Shift+Tab, or ArrowUp on the first option go back to the field). Without
 *   one, Shift+Tab or ArrowUp on the first option go back to the trigger.
 *   PageUp and PageDown move 10 options. Alt+ArrowUp chooses the option and
 *   closes the menu; in a MultiSelect it only closes it.
 * - Tab on an option moves on past the Select, choosing the option first
 *   unless it's a MultiSelect: focus goes to the trigger, the Tab carries on
 *   from there, and the menu closes without pulling focus back.
 * - Escape moves focus to the trigger before the focused option goes away.
 * - Pressing the trigger or its search field keeps the menu open. Pressing a
 *   tag's close button or the clear button keeps focus where it is and
 *   doesn't toggle the menu.
 */
export const useSelectFocus = ({
  open,
  setOpen,
  isSearchable,
  isDisabled,
  selectionControl,
  canClear,
  setSearchText,
  onBlur,
  triggerRef,
  searchRef,
  menuRef,
}: SelectFocusOptions) => {
  const { multiple, values, removeValue, clearValues } = selectionControl;

  const tabbedOutRef = useRef(false);
  const openFocusRef = useRef<OpenFocus | null>(null);
  const hasSearchField = open && isSearchable;

  const focusTrigger = () => {
    triggerRef.current?.focus();
  };

  const focusMenu = () => {
    const menu = menuRef.current;
    const target = hasSearchField ? searchRef.current : menu && entryItem(menu);
    target?.focus();
    return Boolean(target);
  };

  const field = () => (hasSearchField ? searchRef.current : triggerRef.current);

  // The tags' close buttons, in the order of `values`.
  const tags = () =>
    Array.from(
      triggerRef.current?.querySelectorAll<HTMLElement>(
        '[data-slot="tag"] [data-slot="close"]',
      ) ?? [],
    );

  /** Removes `value`; its focused tag hands focus to a neighbor first. */
  const removeTag = (value: string, tag: HTMLElement, toNext = true) => {
    if (tag === document.activeElement) {
      const all = tags();
      const index = all.indexOf(tag);
      const [near, far] = toNext
        ? [all[index + 1], all[index - 1]]
        : [all[index - 1], all[index + 1]];
      (near ?? far ?? field())?.focus();
    }
    removeValue(value);
  };

  /** Backspace, Delete and ArrowLeft on the trigger or an empty search field. */
  const editValues = (key: string) => {
    if (key === 'ArrowLeft') {
      const last = tags().at(-1);
      last?.focus();
      return Boolean(last);
    }

    if (key !== 'Backspace' && key !== 'Delete') {
      return false;
    }

    if (!multiple) {
      if (canClear) clearValues();
      return canClear;
    }

    const value = key === 'Backspace' ? values.at(-1) : values[0];
    if (value !== undefined) {
      removeValue(value);
      return true;
    }

    return false;
  };

  /** A tag's keys, kept from the trigger's handlers. */
  const onTagKeyDown = (event: KeyboardEvent<HTMLElement>, value: string) => {
    const all = tags();
    const index = values.indexOf(value);

    if (event.key === 'Enter' || event.key === ' ') {
      // The close button's click removes the tag; on the trigger, the key
      // would toggle the menu.
      event.stopPropagation();
      return;
    }

    if (event.key === 'ArrowLeft') {
      all[index - 1]?.focus();
    } else if (event.key === 'ArrowRight') {
      (all[index + 1] ?? field())?.focus();
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      removeTag(value, all[index], event.key === 'Delete');
    } else return;

    event.preventDefault();
    event.stopPropagation();
  };

  const isInside = (node: EventTarget | null) => {
    return contains(triggerRef, node) || contains(menuRef, node);
  };
  const blur = (event: FocusEvent) => {
    if (!isInside(event.relatedTarget)) onBlur?.();
  };

  const trigger = {
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (isDisabled) return;
      if (editValues(event.key)) {
        event.preventDefault();
      } else if (!open) {
        // Radix opens on ArrowDown, Enter and Space.
        if (isTypingKey(event)) {
          if (isSearchable) setSearchText(event.key);
          else openFocusRef.current = { key: event.key };
        } else if (['ArrowUp', 'Home', 'End'].includes(event.key)) {
          openFocusRef.current = event.key === 'End' ? 'last' : 'first';
        } else return;
        event.preventDefault();
        setOpen(true);
      } else if (hasSearchField && isTypingKey(event)) {
        searchRef.current?.focus();
      } else if (event.key === 'ArrowDown' || isForwardTab(event)) {
        if (event.key === 'Tab' && hasSearchField) return;
        if (focusMenu()) event.preventDefault();
      }
    },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.target instanceof Element && event.target.closest('button'))
        event.preventDefault();
    },
    onBlur: blur,
  };

  const closeToTrigger = () => {
    focusTrigger();
    setOpen(false);
  };

  const menu = {
    onOpenAutoFocus: (event: Event) => {
      const openFocus = openFocusRef.current;
      openFocusRef.current = null;
      const items = menuRef.current ? menuItems(menuRef.current) : [];

      if (openFocus === 'first' || openFocus === 'last') {
        const target = openFocus === 'first' ? items[0] : items.at(-1);
        if (!target) return;
        event.preventDefault();
        target.focus();
        return;
      }

      if (hasSearchField || !focusMenu()) return;
      event.preventDefault();
      // The key that opened the menu starts Dropdown's typeahead, so the
      // keys typed after it extend the same search.
      if (openFocus) {
        document.activeElement?.dispatchEvent(
          new KeyboardEvent('keydown', { key: openFocus.key, bubbles: true }),
        );
      }
    },
    onCloseAutoFocus: (event: Event) => {
      if (!tabbedOutRef.current) return;
      tabbedOutRef.current = false;
      event.preventDefault();
    },
    onEscapeKeyDown: focusTrigger,
    onInteractOutside: (event: Event) => {
      if (contains(triggerRef, event.target)) event.preventDefault();
    },
    // Before the option's own keys, which Radix maps differently.
    onKeyDownCapture: (event: KeyboardEvent<HTMLDivElement>) => {
      if (!isInMenu(event) || !(event.target instanceof HTMLElement)) return;
      const option = event.target;
      const items = menuItems(event.currentTarget);
      const index = items.indexOf(option);
      // Clicked, an option is chosen as on Enter; a disabled one blocks it.
      const choose = () => {
        if (!multiple && index !== -1) option.click();
      };

      if (isForwardTab(event)) {
        tabbedOutRef.current = true;
        choose();
        closeToTrigger();
      } else if (event.key === 'ArrowUp' && event.altKey) {
        event.preventDefault();
        choose();
        closeToTrigger();
      } else if (
        index !== -1 &&
        (event.key === 'PageUp' || event.key === 'PageDown')
      ) {
        event.preventDefault();
        const step = event.key === 'PageUp' ? -pageSize : pageSize;
        const next = Math.min(Math.max(index + step, 0), items.length - 1);
        items[next].focus();
      } else return;

      event.stopPropagation();
    },
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (hasSearchField || !isInMenu(event)) return;
      if (!backsOutOfItems(event, event.currentTarget)) return;
      event.preventDefault();
      focusTrigger();
    },
    onBlur: blur,
  };

  return { trigger, menu, focusTrigger, removeTag, onTagKeyDown, editValues };
};
