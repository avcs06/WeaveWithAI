import type { PopperContentProps } from '@radix-ui/react-popper';
import type { DOMAttributes, ReactElement, ReactNode } from 'react';

/** The trigger's own props that Tooltip composes with its handlers. */
export type TooltipTriggerProps = Pick<
  DOMAttributes<HTMLElement>,
  | 'onPointerMove'
  | 'onPointerLeave'
  | 'onPointerDown'
  | 'onClick'
  | 'onFocus'
  | 'onBlur'
> & { 'aria-describedby'?: string };

export type TooltipProps = {
  /**
   * What it shows. Array entries stack 8px apart; empty ones are skipped.
   * Nothing to show: never opens.
   */
  tooltip?: ReactNode | ReactNode[];
  /**
   * The trigger's description for screen readers; defaults to `tooltip`. Omit
   * text the trigger already says; `null` for none.
   */
  description?: ReactNode | ReactNode[];
  /** The trigger: an element, or a component that passes its props to one. */
  children: ReactElement<TooltipTriggerProps>;
  side?: PopperContentProps['side'];
  align?: PopperContentProps['align'];
  className?: string;
};

export type TooltipProviderProps = {
  /**
   * How long the pointer rests on a trigger before its tooltip opens, in ms.
   */
  delayDuration?: number;
  /** After a tooltip closes, how long the next one opens without the delay. */
  skipDelayDuration?: number;
  children: ReactNode;
};
