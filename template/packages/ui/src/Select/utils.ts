import type { KeyboardEvent, RefObject } from 'react';

export const isForwardTab = (event: KeyboardEvent) =>
  event.key === 'Tab' && !event.shiftKey;

export const contains = (
  ref: RefObject<HTMLElement | null>,
  node: EventTarget | null,
) => node instanceof Node && Boolean(ref.current?.contains(node));

export const menuMessage = (
  loading: boolean,
  count: number,
  searching: boolean,
) => {
  if (loading) return 'Loading…';
  if (count > 0) return '';
  return searching ? 'No matches' : 'No options';
};

export const announcement = (
  message: string,
  count: number,
  searching: boolean,
) => {
  if (message || !searching) return message;
  return `${count} ${count === 1 ? 'option' : 'options'}`;
};
