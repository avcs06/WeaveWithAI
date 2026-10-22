// Each calls the event's own method, so it can be passed as a handler:
// `onClick={preventDefault}`. They take React's events and DOM events.

export const preventDefault = (event: { preventDefault(): void }) =>
  event.preventDefault();

export const stopPropagation = (event: { stopPropagation(): void }) =>
  event.stopPropagation();
