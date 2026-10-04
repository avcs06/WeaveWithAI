'use client';

import { classNames } from '@packages/styles/classNames';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import React, { type ReactElement, type ReactNode } from 'react';

import { tooltip as tooltipClassName } from './Tooltip.css';

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

const isShown = (entry: ReactNode) =>
  entry !== undefined && entry !== null && entry !== false && entry !== '';

/** Opens after the app-wide delay set by `TooltipPrimitive.Provider` in `UIRoot`. */
export const Tooltip = ({
  tooltip,
  children,
  side = 'top',
  align = 'center',
  portal = true,
  className,
}: TooltipProps) => {
  const entries = (Array.isArray(tooltip) ? tooltip : [tooltip]).filter(
    isShown,
  );

  // Wrapped only with content: an idle Radix trigger still reports an open to
  // the provider, which turns off the open delay for every tooltip.
  if (entries.length === 0) return children;

  const content = (
    <TooltipPrimitive.Content
      side={side}
      align={align}
      sideOffset={10}
      className={classNames(tooltipClassName, 'flex-col-gap-2', className)}
    >
      {entries.map((entry, index) => (
        <div key={index}>{entry}</div>
      ))}
    </TooltipPrimitive.Content>
  );

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      {portal ? (
        <TooltipPrimitive.Portal>{content}</TooltipPrimitive.Portal>
      ) : (
        content
      )}
    </TooltipPrimitive.Root>
  );
};
