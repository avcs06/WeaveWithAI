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
   * What the tooltip shows. Entries of an array stack 8px apart, in order;
   * empty entries are skipped. With nothing to show, it never opens.
   */
  tooltip?: ReactNode | ReactNode[];
  /**
   * What screen readers get, without hovering or focusing: the trigger's
   * description. Left out, it's `tooltip`. Leave out text the trigger
   * already says, like its own label in full; `null` for none.
   */
  description?: ReactNode | ReactNode[];
  /** The trigger: an element, or a component that passes its props to one. */
  children: ReactElement<TooltipTriggerProps>;
  side?: PopperContentProps['side'];
  align?: PopperContentProps['align'];
  className?: string;
};

export type TooltipProviderProps = {
  /** How long the pointer rests on a trigger before its tooltip opens, in ms. */
  delayDuration?: number;
  /** After a tooltip closes, how long the next one opens without the delay. */
  skipDelayDuration?: number;
  children: ReactNode;
};
