import '@testing-library/jest-dom';
import { act } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// The stubs below do nothing on purpose.
const noop = () => undefined;

// Browser APIs jsdom lacks, used by Radix, the virtualizer and Truncate. Calls
// back once per `observe`, as browsers do on the first observation.
class ResizeObserverStub {
  constructor(private callback: ResizeObserverCallback) {}
  observe() {
    queueMicrotask(() =>
      act(() => this.callback([], this as unknown as ResizeObserver)),
    );
  }
  unobserve = noop;
  disconnect = noop;
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

if (typeof globalThis.PointerEvent === 'undefined') {
  globalThis.PointerEvent = class PointerEvent extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  } as unknown as typeof PointerEvent;
}

Element.prototype.scrollTo ??= noop;
Element.prototype.scrollIntoView ??= noop;
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= noop;
Element.prototype.releasePointerCapture ??= noop;

window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
  }) as MediaQueryList;
