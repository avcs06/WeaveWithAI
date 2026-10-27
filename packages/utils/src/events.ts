// Each calls the event's own method, so it can be passed as a handler:
// `onClick={preventDefault}`. They take React's events and DOM events.

export const preventDefault = (event: { preventDefault(): void }) =>
  event.preventDefault();

export const stopPropagation = (event: { stopPropagation(): void }) =>
  event.stopPropagation();

/**
 * Runs `handler`, then `own` unless `handler` prevented the default: a
 * component's caller can turn off its behavior for one event.
 */
export const composeHandlers =
  <E extends { defaultPrevented: boolean }>(
    handler: ((event: E) => void) | undefined,
    own: (event: E) => void,
  ) =>
  (event: E) => {
    // A default already prevented before `handler` ran, as a child's handler
    // can while the event bubbles up, isn't the caller opting out.
    const preventedBefore = event.defaultPrevented;
    handler?.(event);
    const handlerPrevented = !preventedBefore && event.defaultPrevented;
    if (!handlerPrevented) own(event);
  };
