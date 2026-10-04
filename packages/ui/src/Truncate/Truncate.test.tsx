import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Truncate } from './Truncate';

// jsdom has no layout: give the text and its box widths so Truncate can tell
// whether the text is cut.
const layout = (textWidth: number, boxWidth: number) => {
  const rect = (width: number) => ({ width }) as DOMRect;
  Range.prototype.getBoundingClientRect = () => rect(textWidth);
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(() => rect(boxWidth));
};

const hoverText = async (text: string) => {
  // The ResizeObserver stub reports the first size in a microtask.
  await act(async () => undefined);
  await userEvent.hover(screen.getByText(text));
};

// Radix opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const tooltipText = async () =>
  (await screen.findByRole('tooltip')).textContent;

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
    await hoverText('Quarterly planning review');
    expect(await tooltipText()).toBe('Quarterly planning review');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when it fits: no tooltip', async () => {
    layout(100, 100);
    const { container } = renderUI(<Truncate>Review</Truncate>);
    await hoverText('Review');
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a custom tooltip: above the full text when cut', async () => {
    layout(200, 100);
    renderUI(
      <Truncate tooltip="Starts at 10:00">Quarterly planning review</Truncate>,
    );
    await hoverText('Quarterly planning review');
    await screen.findByRole('tooltip');
    const entries = document.querySelectorAll('[data-side] > div');
    expect(Array.from(entries, (entry) => entry.textContent)).toEqual([
      'Starts at 10:00',
      'Quarterly planning review',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('with a custom tooltip: on its own when it fits', async () => {
    layout(100, 100);
    renderUI(<Truncate tooltip="Starts at 10:00">Review</Truncate>);
    await hoverText('Review');
    expect(await tooltipText()).toBe('Starts at 10:00');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('is not in the tab order, even with a custom tooltip', () => {
    renderUI(<Truncate tooltip="Starts at 10:00">Review</Truncate>);
    expect(screen.getByText('Review')).not.toHaveAttribute('tabindex');
  });

  it('alwaysShowTooltip: shows the full text even when it fits', async () => {
    layout(100, 100);
    renderUI(<Truncate alwaysShowTooltip>Review</Truncate>);
    await hoverText('Review');
    expect(await tooltipText()).toBe('Review');
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
    expect(observe).toHaveBeenLastCalledWith(text);
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
