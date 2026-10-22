import type * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ReactElement, ReactNode } from 'react';

export type TooltipProps = {
  /**
   * What the tooltip shows. Entries of an array stack 8px apart, in order;
   * empty entries are skipped. With nothing to show, it never opens.
   */
  tooltip?: ReactNode | ReactNode[];
  /** The trigger: an element, or a component that passes its props to one. */
  children: ReactElement;
  side?: TooltipPrimitive.TooltipContentProps['side'];
  align?: TooltipPrimitive.TooltipContentProps['align'];
  portal?: boolean;
  className?: string;
};
