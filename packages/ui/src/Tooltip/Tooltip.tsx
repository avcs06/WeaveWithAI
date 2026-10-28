'use client';

import { composeHandlers } from '@packages/utils/events';
import React, {
  cloneElement,
  type MouseEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
} from 'react';

import { hasContent, joinIds } from '../utils';

import { useTooltipContext } from './context';

import type { TooltipProps } from './Tooltip.types';

const toEntries = (content: ReactNode | ReactNode[]) =>
  (Array.isArray(content) ? content : [content]).filter(hasContent);

/**
 * A short hint on a focusable element that isn't a control, shown on hover
 * and keyboard focus. Controls take a `tooltip` prop. Never the only label.
 *
 * @invalidAlternative [role="tooltip"], [data-tooltip]
 * @invalidAlternative button[title], a[title], span[title], div[title], p[title], i[title], img[title], svg[title], input[title], label[title], li[title], td[title], th[title]
 * @invalidAlternative Button[title], IconButton[title], PlainButton[title], Link[title], NextLink[title], Tag[title], Chip[title], Avatar[title], Truncate[title], Card[title], Input[title], Dropdown.Item[title]
 */
export const Tooltip = (props: TooltipProps) => {
  const {
    tooltip,
    description,
    children,
    side = 'top',
    align = 'center',
    className,
  } = props;
  const id = useId();
  const { controller } = useTooltipContext();
  const { useStore } = controller;
  const isShown = useStore((state) => state.open && state.target?.id === id);

  const entries = toEntries(tooltip);
  const isEmpty = entries.length === 0;
  // Only the shown trigger's entries matter, so only its effect reruns.
  const shownEntries = isShown && !isEmpty ? entries : null;

  useLayoutEffect(() => {
    if (shownEntries) controller.update(id, shownEntries);
  }, [controller, id, shownEntries]);

  // Emptied or unmounted, it lets go of the tooltip before the browser paints.
  useLayoutEffect(() => {
    if (isEmpty) controller.release(id);
    return () => controller.release(id);
  }, [controller, id, isEmpty]);

  // Nothing to show: the bare trigger, so it isn't recreated when content
  // comes.
  if (isEmpty) return children;

  const trigger = children.props;
  // Passed, even as `undefined`, it replaces the tooltip's content.
  const descriptions =
    'description' in props ? toEntries(description) : entries;
  const isDescribed = descriptions.length > 0;
  // The element the event's handler is on: the trigger, to place it at.
  const target = (event: { currentTarget: HTMLElement }) => ({
    id,
    anchor: event.currentTarget,
    entries,
    side,
    align,
    className,
  });

  const triggerElement = cloneElement(children, {
    'aria-describedby': joinIds(trigger['aria-describedby'], isDescribed && id),
    onPointerMove: composeHandlers(trigger.onPointerMove, (event) => {
      // Touch has no hover: a tap is a press.
      if (event.pointerType !== 'touch') controller.enter(target(event));
    }),
    onPointerLeave: composeHandlers(trigger.onPointerLeave, () =>
      controller.leave(id),
    ),
    onPointerDown: composeHandlers(trigger.onPointerDown, () =>
      controller.press(id),
    ),
    onClick: (event: MouseEvent<HTMLElement>) => {
      trigger.onClick?.(event);
      // A control disabled with a reason cancels clicks; its tooltip says why,
      // so it stays. Any other click acted, so the tooltip closes.
      if (event.defaultPrevented) controller.showNow(target(event));
      else controller.close(id);
    },
    // Not focus a script restores (closing menu or dialog). The focused element
    // can be inside the trigger, like a field in its box, so it must match, not
    // the trigger.
    onFocus: composeHandlers(trigger.onFocus, (event) => {
      const focused =
        event.target instanceof Element ? event.target : event.currentTarget;
      if (focused.matches(':focus-visible')) controller.showNow(target(event));
    }),
    onBlur: composeHandlers(trigger.onBlur, () => controller.close(id)),
  });
  if (!isDescribed) return triggerElement;

  return (
    <>
      {triggerElement}
      {/* Screen readers read it without the hover or focus that shows the
          tooltip, such as a disabled control's reason. */}
      <span id={id} hidden>
        {descriptions.map((entry, index) => (
          <span key={index}>{entry} </span>
        ))}
      </span>
    </>
  );
};
