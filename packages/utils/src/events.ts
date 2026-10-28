// Each calls the event's own method, so it works as a handler:
// `onClick={preventDefault}`. Takes React and DOM events.

export const preventDefault = (event: { preventDefault(): void }) =>
  event.preventDefault();

export const stopPropagation = (event: { stopPropagation(): void }) =>
  event.stopPropagation();

/**
 * Runs `handler`, then `own` unless `handler` prevented the default, so a
 * caller can turn off a component's behavior for one event.
 */
export const composeHandlers =
  <E extends { defaultPrevented: boolean }>(
    handler: ((event: E) => void) | undefined,
    own: (event: E) => void,
  ) =>
  (event: E) => {
    // A default prevented before `handler` ran, e.g. by a child's handler
    // while bubbling, isn't the caller opting out.
    const preventedBefore = event.defaultPrevented;
    handler?.(event);
    const handlerPrevented = !preventedBefore && event.defaultPrevented;
    if (!handlerPrevented) own(event);
  };
