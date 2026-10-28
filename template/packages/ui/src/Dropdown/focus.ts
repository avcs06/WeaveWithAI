import type { KeyboardEvent } from 'react';

const item = '[data-slot="item"]';

const isHTMLElement = (node: Element): node is HTMLElement =>
  node instanceof HTMLElement;

/**
 * A menu's rows in order, disabled ones included: the arrow keys reach them.
 * A submenu's rows are in its own menu.
 */
export const menuItems = (menu: HTMLElement) =>
  Array.from(menu.querySelectorAll(item)).filter(isHTMLElement);

export const enabledItems = (menu: HTMLElement) =>
  menuItems(menu).filter((row) => !row.hasAttribute('data-disabled'));

/** Where focus enters the rows: the first selected one, else the first. */
export const entryItem = (menu: HTMLElement) => {
  const items = enabledItems(menu);
  return items.find((item) => item.hasAttribute('data-selected')) ?? items[0];
};

/**
 * A key that types a character. Space doesn't count: on a row it chooses,
 * as it does in any menu.
 */
export const isTypingKey = (event: KeyboardEvent) =>
  event.key.length === 1 &&
  event.key !== ' ' &&
  !event.ctrlKey &&
  !event.metaKey &&
  !event.altKey;

/**
 * Shift+Tab on any row, or ArrowUp on the first: focus goes back to what
 * comes before the rows, a search field or a Select's trigger.
 */
export const backsOutOfItems = (
  event: KeyboardEvent<HTMLElement>,
  menu: HTMLElement,
) =>
  (event.key === 'Tab' && event.shiftKey) ||
  (event.key === 'ArrowUp' && event.target === menuItems(menu)[0]);

/** Whether the event comes from this menu's own DOM, not a submenu's. */
export const isInMenu = (event: KeyboardEvent<HTMLElement>) =>
  event.target instanceof Node && event.currentTarget.contains(event.target);
