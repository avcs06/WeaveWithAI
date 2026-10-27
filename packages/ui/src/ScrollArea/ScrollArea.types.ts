import type { ComponentPropsWithRef, Ref } from 'react';

export type ScrollAreaProps = Omit<
  ComponentPropsWithRef<'div'>,
  'ref' | 'dir'
> & {
  /**
   * The ways it scrolls; `both` by default. `vertical` leaves wide content,
   * like a table, to scroll sideways on its own.
   */
  orientation?: 'vertical' | 'horizontal' | 'both';
  /**
   * Names the scroll region. Give one when the content has nothing to Tab
   * to: the region then takes focus itself, so the keyboard can scroll it.
   */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Reaches the scrolling element; every other prop goes on the root. */
  ref?: Ref<HTMLDivElement>;
};
