import { createStore } from '@packages/utils/state';

import type { TooltipProps } from './Tooltip.types';
import type { ReactNode } from 'react';

/** The trigger a tooltip is for, what it shows, and how to place it. */
export type TooltipTarget = Pick<
  TooltipProps,
  'side' | 'align' | 'className'
> & {
  id: string;
  anchor: HTMLElement;
  entries: ReactNode[];
};

type TooltipState = {
  /** The hovered or focused trigger: waiting out the delay, or shown. */
  target: TooltipTarget | null;
  open: boolean;
  /** Shown without the delay, right after another tooltip. */
  instant: boolean;
};

type TooltipTimings = { delayDuration: number; skipDelayDuration: number };

// Long enough for the pointer to cross the gap between trigger and tooltip.
const leaveGrace = 100;

/**
 * The one tooltip of a `TooltipProvider`: which trigger it's for, when it
 * opens and when it closes, with the timings Radix Tooltip has.
 */
export const createTooltipController = (initialTimings: TooltipTimings) => {
  const store = createStore<TooltipState>(() => ({
    target: null,
    open: false,
    instant: false,
  }));

  let timings = initialTimings;
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let skipDelayTimer: ReturnType<typeof setTimeout> | undefined;
  // Moving along a toolbar, each tooltip opens at once after the first.
  let isDelayed = true;
  // A press closes the tooltip, and the focus it brings doesn't reopen it.
  let isPressing = false;
  // One function, so adding it again on each press adds no listener.
  const endPress = () => {
    isPressing = false;
    document.removeEventListener('pointerup', endPress);
    document.removeEventListener('pointercancel', endPress);
  };
  // Pointer moves count once per visit, so a pressed trigger stays closed
  // until the pointer leaves and comes back.
  let enteredId: string | undefined;

  const isTarget = (id: string) => store.getState().target?.id === id;

  const show = (target: TooltipTarget, instant: boolean) => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    clearTimeout(skipDelayTimer);
    isDelayed = false;
    store.setState({ target, open: true, instant });
  };

  const hide = () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    if (store.getState().open) {
      skipDelayTimer = setTimeout(() => {
        isDelayed = true;
      }, timings.skipDelayDuration);
    }
    store.setState({ target: null, open: false });
  };

  return {
    useStore: store,
    setTimings: (next: TooltipTimings) => {
      timings = next;
    },
    /** Pointer moved onto a trigger: open after the delay, or at once. */
    enter: (target: TooltipTarget) => {
      if (enteredId === target.id) return;
      enteredId = target.id;
      if (isTarget(target.id) && store.getState().open) {
        clearTimeout(closeTimer);
      } else if (!isDelayed) {
        show(target, true);
      } else {
        clearTimeout(closeTimer);
        clearTimeout(openTimer);
        store.setState({ target, open: false });
        openTimer = setTimeout(
          () => show(target, false),
          timings.delayDuration,
        );
      }
    },
    /** Pointer left a trigger or its tooltip: closes unless it comes back. */
    leave: (id: string) => {
      if (enteredId === id) enteredId = undefined;
      if (!isTarget(id)) return;
      if (!store.getState().open) return hide();
      clearTimeout(closeTimer);
      closeTimer = setTimeout(hide, leaveGrace);
    },
    /** Pointer reached the tooltip itself: it stays. */
    stay: () => clearTimeout(closeTimer),
    /** Shows at once, without the delay; not the focus a press brings. */
    showNow: (target: TooltipTarget) => {
      if (!isPressing) show(target, true);
    },
    press: (id: string) => {
      isPressing = true;
      // A touch that turns into a scroll ends in a cancel, not an up.
      document.addEventListener('pointerup', endPress);
      document.addEventListener('pointercancel', endPress);
      // One still waiting out the delay opens after it, as Radix's does.
      if (isTarget(id) && store.getState().open) hide();
    },
    /** New entries from the shown trigger. */
    update: (id: string, entries: ReactNode[]) => {
      const { target } = store.getState();
      if (target?.id === id && target.entries !== entries)
        store.setState({ target: { ...target, entries } });
    },
    close: (id: string) => {
      if (isTarget(id)) hide();
    },
    /**
     * The trigger has nothing to show, or is gone: it closes, and the
     * pointer's visit is forgotten, so content that comes back opens on the
     * next move.
     */
    release: (id: string) => {
      if (enteredId === id) enteredId = undefined;
      if (isTarget(id)) hide();
    },
    dismiss: hide,
  };
};

export type TooltipController = ReturnType<typeof createTooltipController>;
