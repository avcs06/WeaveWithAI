'use client';

import { classNames } from '@packages/styles/classNames';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import React, { useEffect, useState } from 'react';

import { mergeRefs } from '../utils';

import {
  scrollbar,
  thumb,
  viewport as viewportClassName,
} from './ScrollArea.css';

import type { ScrollAreaProps } from './ScrollArea.types';

// What Tab reaches. Content that has any scrolls into view as it's focused.
const tabbable = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ');

const Scrollbar = ({
  orientation,
}: {
  orientation: 'vertical' | 'horizontal';
}) => {
  const isVertical = orientation === 'vertical';
  return (
    <ScrollAreaPrimitive.Scrollbar
      orientation={orientation}
      data-slot="scrollbar"
      className={classNames(
        scrollbar,
        isVertical ? 'flex-row-gap-0' : 'flex-col-gap-0',
      )}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="thumb"
        className={classNames(
          thumb,
          isVertical ? 'flex-fill-x' : 'flex-fill-y',
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
};

/**
 * A box that scrolls its own content, for a box with its own height (`h-*`
 * or `max-h-*` on it). Scrollbars show while the content overflows.
 *
 * @invalidAlternative import('@radix-ui/react-scroll-area')
 * @invalidAlternative .overflow-auto, .overflow-scroll, .overflow-y-auto, .overflow-y-scroll, .overflow-x-auto, .overflow-x-scroll
 */
export const ScrollArea = ({
  ref,
  orientation = 'both',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  className,
  children,
  ...props
}: ScrollAreaProps) => {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [isTabStop, setIsTabStop] = useState(false);

  // A region that scrolls with nothing to Tab to takes focus itself, so the
  // keyboard can scroll it.
  useEffect(() => {
    if (!viewport) return;

    const update = () => {
      const overflows =
        viewport.scrollHeight > viewport.clientHeight ||
        viewport.scrollWidth > viewport.clientWidth;
      setIsTabStop(overflows && !viewport.querySelector(tabbable));
    };

    const resizes = new ResizeObserver(update);
    const mutations = new MutationObserver(update);
    resizes.observe(viewport);
    if (viewport.firstElementChild) resizes.observe(viewport.firstElementChild);
    mutations.observe(viewport, {
      subtree: true,
      childList: true,
      attributeFilter: ['tabindex', 'href', 'contenteditable'],
    });
    update();

    return () => {
      resizes.disconnect();
      mutations.disconnect();
    };
  }, [viewport]);

  const isNamed = Boolean(ariaLabel || ariaLabelledBy);

  return (
    <ScrollAreaPrimitive.Root
      // Scrollbars mount only while the content overflows, so a parent can
      // make room for them with `:has(> [data-orientation])`.
      type="auto"
      {...props}
      className={classNames('flex-col-gap-0', className)}
    >
      <ScrollAreaPrimitive.Viewport
        ref={mergeRefs(ref, setViewport)}
        data-slot="viewport"
        role={isNamed ? 'region' : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={isTabStop ? 0 : undefined}
        disableImplicitContentElement
        className={classNames(viewportClassName, 'flex-fill-y')}
      >
        <ScrollAreaPrimitive.Content
          data-slot="content"
          // Radix sizes the content to its widest child; scrolling only up
          // and down, it takes the viewport's width.
          style={orientation === 'vertical' ? { display: 'block' } : undefined}
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      {orientation !== 'horizontal' && <Scrollbar orientation="vertical" />}
      {orientation !== 'vertical' && <Scrollbar orientation="horizontal" />}
      {orientation === 'both' && <ScrollAreaPrimitive.Corner />}
    </ScrollAreaPrimitive.Root>
  );
};

/**
 * A ScrollArea for a flex column, like a panel or dialog body: it takes its
 * content's height until the column has no room left, then scrolls.
 *
 * @invalidAlternative .min-h-0.overflow-auto, .min-h-0.overflow-y-auto, .flex-fill-y.overflow-auto, .flex-fill-y.overflow-y-auto
 */
export const FlexScrollArea = ({ className, ...props }: ScrollAreaProps) => (
  <ScrollArea {...props} className={classNames('min-h-0', className)} />
);
