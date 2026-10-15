'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import React, { forwardRef } from 'react';

export type ScrollAreaProps = Omit<
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
  'children' | 'type'
> & {
  children: React.ReactNode;
  orientation?: 'vertical' | 'horizontal' | 'both';
  viewportRef?: React.Ref<HTMLDivElement>;
  viewportClassName?: string;
  onViewportScroll?: React.UIEventHandler<HTMLDivElement>;
};
// Intentionally empty: contract tests define the implementation target.
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  () => null,
);
export const FlexScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  () => null,
);
ScrollArea.displayName = 'ScrollArea';
FlexScrollArea.displayName = 'FlexScrollArea';
