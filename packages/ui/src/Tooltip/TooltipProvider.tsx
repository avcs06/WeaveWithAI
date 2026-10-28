'use client';

import { classNames } from '@packages/styles/classNames';
import * as Popper from '@radix-ui/react-popper';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  TooltipContext,
  type TooltipContextValue,
  useTooltipContext,
} from './context';
import { createTooltipController } from './controller';
import { tooltip as tooltipClassName } from './Tooltip.css';

import type { TooltipProviderProps } from './Tooltip.types';

/** The provider's one tooltip, placed at whichever trigger it's for. */
const TooltipLayer = () => {
  const { controller } = useTooltipContext();
  const { useStore } = controller;
  const target = useStore('target');
  const open = useStore('open');
  const instant = useStore('instant');
  const shown = open ? target : null;

  useEffect(() => {
    if (!shown) return;

    // Escape closes the tooltip first, before a menu or dialog under it.
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      controller.dismiss();
    };

    // Scrolling moves the trigger away from it.
    const dismissOnScroll = (event: Event) => {
      if (event.target instanceof Node && event.target.contains(shown.anchor))
        controller.dismiss();
    };

    window.addEventListener('keydown', dismissOnEscape, { capture: true });
    window.addEventListener('scroll', dismissOnScroll, { capture: true });
    return () => {
      window.removeEventListener('keydown', dismissOnEscape, { capture: true });
      window.removeEventListener('scroll', dismissOnScroll, { capture: true });
    };
  }, [controller, shown]);

  if (!shown) return null;

  const { id, anchor, entries, side, align, className } = shown;
  // Shown only after a hover or focus, so only in the browser.
  return createPortal(
    <Popper.Root>
      <Popper.Anchor virtualRef={{ current: anchor }} />
      <Popper.Content
        role="tooltip"
        // The trigger's description already says it.
        aria-hidden
        side={side}
        align={align}
        sideOffset={10}
        data-state={instant ? 'instant-open' : 'delayed-open'}
        // The pointer can move onto the tooltip without it closing.
        onPointerEnter={controller.stay}
        onPointerLeave={() => controller.leave(id)}
        className={classNames(tooltipClassName, 'flex-col-gap-2', className)}
      >
        {entries.map((entry, index) => (
          <div key={index}>{entry}</div>
        ))}
      </Popper.Content>
    </Popper.Root>,
    document.body,
  );
};

// The mounted provider that owns the page's tooltip.
let pageContext: TooltipContextValue | undefined;

/**
 * The app's one tooltip, which every Tooltip shows through. `UIRoot` renders
 * it. A provider in a root of its own, like a confirmation dialog's, shares
 * the mounted one's tooltip, so two never show at once.
 *
 * @internal
 */
export const TooltipProvider = ({
  delayDuration = 700,
  skipDelayDuration = 300,
  children,
}: TooltipProviderProps) => {
  // One value for good, so the Tooltips inside don't rerender with it.
  const [{ context, isOwner }] = useState(() =>
    pageContext
      ? {
          context: pageContext,
          isOwner: false,
        }
      : {
          context: {
            controller: createTooltipController({
              delayDuration,
              skipDelayDuration,
            }),
          },
          isOwner: true,
        },
  );
  const { controller } = context;

  useLayoutEffect(() => {
    if (!isOwner) return;
    pageContext = context;
    return () => {
      if (pageContext === context) pageContext = undefined;
    };
  }, [context, isOwner]);

  useEffect(() => {
    if (isOwner) controller.setTimings({ delayDuration, skipDelayDuration });
  }, [controller, isOwner, delayDuration, skipDelayDuration]);

  return (
    <TooltipContext value={context}>
      {children}
      {isOwner && <TooltipLayer />}
    </TooltipContext>
  );
};
