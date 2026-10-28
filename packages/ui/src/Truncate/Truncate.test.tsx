import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Truncate } from './Truncate';
import { useTruncation } from './useTruncation';

// jsdom has no layout: give the text and its box widths. The shared observer
// is created once per module, so the mock must be in place before the first
// render and read the current sizes on every observation.
const sizes = { text: 0, box: 0 };

const contentWidthFor = (element: Element) => {
  const style = getComputedStyle(element as HTMLElement);
  const padding =
    (parseFloat(style.paddingLeft) || 0) +
    (parseFloat(style.paddingRight) || 0);
  return sizes.box - padding;
};

class MeasuringResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    queueMicrotask(() =>
      act(() =>
        this.callback(
          [
            {
              target,
              contentRect: { width: contentWidthFor(target) },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        ),
      ),
    );
  }
  unobserve() {
    return undefined;
  }
  disconnect() {
    return undefined;
  }
}
globalThis.ResizeObserver =
  MeasuringResizeObserver as unknown as typeof ResizeObserver;

const layout = (textWidth: number, boxWidth: number) => {
  sizes.text = textWidth;
  sizes.box = boxWidth;
  Range.prototype.getBoundingClientRect = () =>
    ({ width: sizes.text }) as DOMRect;
};

const hoverText = async (text: string) => {
  // The ResizeObserver stub reports the first size in a microtask.
  await act(async () => undefined);
  await userEvent.hover(screen.getByText(text));
};

// Radix opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

// The shown tooltip is `aria-hidden`, so role queries must include hidden
// elements.
const tooltipOptions = { hidden: true } as const;

const findTooltip = () => screen.findByRole('tooltip', tooltipOptions);
const queryTooltip = () => screen.queryByRole('tooltip', tooltipOptions);

const tooltipText = async () => (await findTooltip()).textContent;

const tooltipEntries = async () => {
  await findTooltip();
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

describe('Truncate', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error jsdom has none; tests add one.
    delete Range.prototype.getBoundingClientRect;
  });

  it('when cut: shows the full text in a tooltip', async () => {
    layout(200, 100);
    const { container } = renderUI(
      <Truncate>Quarterly planning review</Truncate>,
    );
    const text = screen.getByText('Quarterly planning review');
    await hoverText('Quarterly planning review');
    expect(await tooltipText()).toBe('Quarterly planning review');
    // No description: the full text is already the element's own text.
    expect(container.querySelector('[aria-describedby]')).toBeNull();
    expect(text).not.toHaveAttribute('aria-describedby');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when it fits: no tooltip', async () => {
    layout(100, 100);
    const { container } = renderUI(<Truncate>Review</Truncate>);
    await hoverText('Review');
    await settle();
    expect(queryTooltip()).toBeNull();
    expect(screen.getByText('Review')).not.toHaveAttribute('aria-describedby');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a custom tooltip: above the full text when cut', async () => {
    layout(200, 100);
    renderUI(
      <Truncate tooltip="Starts at 10:00">Quarterly planning review</Truncate>,
    );
    const text = screen.getByText('Quarterly planning review');
    await hoverText('Quarterly planning review');
    expect(await tooltipEntries()).toEqual([
      'Starts at 10:00',
      'Quarterly planning review',
    ]);
    // The custom tooltip is the description; the full text isn't repeated.
    expect(text).toHaveAccessibleDescription('Starts at 10:00');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('with a custom tooltip: on its own when it fits', async () => {
    layout(100, 100);
    renderUI(<Truncate tooltip="Starts at 10:00">Review</Truncate>);
    await hoverText('Review');
    expect(await tooltipText()).toBe('Starts at 10:00');
    expect(screen.getByText('Review')).toHaveAccessibleDescription(
      'Starts at 10:00',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('the custom tooltip describes the text before any hover, for screen readers', () => {
    layout(100, 100);
    renderUI(<Truncate tooltip="Starts at 10:00">Review</Truncate>);
    expect(queryTooltip()).toBeNull();
    expect(screen.getByText('Review')).toHaveAccessibleDescription(
      'Starts at 10:00',
    );
  });

  it('is not in the tab order, even with a custom tooltip', async () => {
    renderUI(
      <>
        <Truncate tooltip="Starts at 10:00">Review</Truncate>
        <button type="button">Next</button>
      </>,
    );
    expect(screen.getByText('Review')).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('Escape closes the tooltip', async () => {
    layout(200, 100);
    renderUI(<Truncate>Quarterly planning review</Truncate>);
    await hoverText('Quarterly planning review');
    expect(await tooltipText()).toBe('Quarterly planning review');
    await userEvent.keyboard('{Escape}');
    expect(queryTooltip()).toBeNull();
  });

  it('inside a button: keyboard focus on the button shows the full text, blur hides it', async () => {
    layout(200, 100);
    renderUI(
      <>
        <button type="button">
          <Truncate>Quarterly planning review</Truncate>
        </button>
        <button type="button">Next</button>
      </>,
    );
    await act(async () => undefined);
    await userEvent.tab();
    const button = screen.getByRole('button', {
      name: 'Quarterly planning review',
    });
    expect(button).toHaveFocus();
    expect(await tooltipText()).toBe('Quarterly planning review');
    expect(await axe(document.body)).toHaveNoViolations();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(queryTooltip()).toBeNull();
  });

  it('alwaysShowTooltip: shows the full text even when it fits', async () => {
    layout(100, 100);
    renderUI(<Truncate alwaysShowTooltip>Review</Truncate>);
    const text = screen.getByText('Review');
    await hoverText('Review');
    expect(await tooltipText()).toBe('Review');
    expect(text).not.toHaveAttribute('aria-describedby');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('alwaysShowTooltip with a custom tooltip: the tooltip above the text it expands', async () => {
    layout(100, 100);
    renderUI(
      <Truncate alwaysShowTooltip tooltip="Design Systems Conference">
        DSC
      </Truncate>,
    );
    const text = screen.getByText('DSC');
    await hoverText('DSC');
    expect(await tooltipEntries()).toEqual([
      'Design Systems Conference',
      'DSC',
    ]);
    expect(text).toHaveAccessibleDescription('Design Systems Conference');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('checks again when a web font finishes loading', async () => {
    const fonts = new EventTarget();
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: fonts,
    });
    try {
      layout(100, 100);
      renderUI(<Truncate>Quarterly planning review</Truncate>);
      await act(async () => undefined);
      // The new font is wider; the box keeps its size.
      layout(200, 100);
      act(() => {
        fonts.dispatchEvent(new Event('loadingdone'));
      });
      await hoverText('Quarterly planning review');
      expect(await tooltipText()).toBe('Quarterly planning review');
    } finally {
      // @ts-expect-error jsdom has none; this test adds one.
      delete document.fonts;
    }
  });

  it('checks again when the text changes', async () => {
    layout(100, 100);
    const { rerender } = renderUI(<Truncate>Review</Truncate>);
    await act(async () => undefined);
    layout(200, 100);
    rerender(<Truncate>Quarterly planning review</Truncate>);
    await act(async () => undefined);
    await hoverText('Quarterly planning review');
    expect(await tooltipText()).toBe('Quarterly planning review');
  });

  it('keeps watching its text after the tooltip wrapper appears', async () => {
    const observe = jest.spyOn(ResizeObserver.prototype, 'observe');
    layout(100, 100);
    const { rerender } = renderUI(<Truncate>Review</Truncate>);
    await act(async () => undefined);
    layout(200, 100);
    rerender(<Truncate>Quarterly planning review</Truncate>);
    await act(async () => undefined);
    const text = screen.getByText('Quarterly planning review');
    expect(observe).toHaveBeenCalledWith(text);
  });

  it('subtracts its own padding from the room for the text', async () => {
    layout(95, 100);
    renderUI(
      <Truncate style={{ paddingLeft: 10 }}>
        Quarterly planning review
      </Truncate>,
    );
    await hoverText('Quarterly planning review');
    expect(await tooltipText()).toBe('Quarterly planning review');
  });
});

describe('useTruncation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error jsdom has none; tests add one.
    delete Range.prototype.getBoundingClientRect;
  });

  const OwnText = () => {
    const { ref, className, truncated } = useTruncation<HTMLSpanElement>();
    return (
      <span ref={ref} className={className} data-truncated={truncated}>
        Quarterly planning review
      </span>
    );
  };

  it('tells whether its own element is cut', async () => {
    layout(200, 100);
    const { container } = renderUI(<OwnText />);
    await act(async () => undefined);
    expect(screen.getByText('Quarterly planning review')).toHaveAttribute(
      'data-truncated',
      'true',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('reports not cut when its own element fits', async () => {
    layout(50, 100);
    renderUI(<OwnText />);
    await act(async () => undefined);
    expect(screen.getByText('Quarterly planning review')).toHaveAttribute(
      'data-truncated',
      'false',
    );
  });
});
