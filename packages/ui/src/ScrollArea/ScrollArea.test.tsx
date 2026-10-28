import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef } from 'react';

import { axe, renderUI } from '../test-utils';

import { FlexScrollArea, ScrollArea } from './ScrollArea';

// jsdom has no layout: everything measures 0 and nothing overflows. The tab
// stop comes from the viewport's scroll and client sizes, so a test that
// needs overflow stubs them.
type Sizes = {
  scrollHeight: number;
  clientHeight: number;
  scrollWidth: number;
  clientWidth: number;
};

const sizeKeys = [
  'scrollHeight',
  'clientHeight',
  'scrollWidth',
  'clientWidth',
] as const;

const mockSizes = (sizes: Sizes) => {
  for (const key of sizeKeys)
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => sizes[key],
    });
};

const unmockSizes = () => {
  for (const key of sizeKeys)
    Reflect.deleteProperty(HTMLElement.prototype, key);
};

const overflowsVertically: Sizes = {
  scrollHeight: 400,
  clientHeight: 100,
  scrollWidth: 100,
  clientWidth: 100,
};

const overflowsHorizontally: Sizes = {
  scrollHeight: 100,
  clientHeight: 100,
  scrollWidth: 400,
  clientWidth: 100,
};

const fits: Sizes = {
  scrollHeight: 100,
  clientHeight: 100,
  scrollWidth: 100,
  clientWidth: 100,
};

// Observer updates land outside React's render and Radix debounces its
// scrollbar bookkeeping: let both settle inside act.
const settleObservers = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });

const viewportOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="viewport"]') as HTMLElement;

const contentOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="content"]') as HTMLElement;

describe('ScrollArea', () => {
  afterEach(unmockSizes);

  it('renders its children in the scrolling viewport', async () => {
    const { container } = renderUI(
      <ScrollArea>
        <p>Be kind to everyone at the event.</p>
      </ScrollArea>,
    );

    const viewport = viewportOf(container);
    expect(viewport).toHaveAttribute('data-radix-scroll-area-viewport');
    expect(contentOf(container)).toHaveTextContent(
      'Be kind to everyone at the event.',
    );
    expect(viewport.contains(contentOf(container))).toBe(true);
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('puts className and other box props on the outer box, not the viewport', async () => {
    const { container } = renderUI(
      <ScrollArea id="conduct" className="h-full" data-kind="text">
        <p>Rules</p>
      </ScrollArea>,
    );

    const viewport = viewportOf(container);
    const root = viewport.parentElement as HTMLElement;
    expect(root).toHaveAttribute('id', 'conduct');
    expect(root).toHaveAttribute('data-kind', 'text');
    expect(root).toHaveClass('h-full');
    expect(viewport).not.toHaveClass('h-full');
    expect(viewport).not.toHaveAttribute('id');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ref reaches the element that scrolls', async () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderUI(
      <ScrollArea ref={ref}>
        <p>Rules</p>
      </ScrollArea>,
    );

    expect(ref.current).toBe(viewportOf(container));
    // The recipe scrolls it back to the top through this ref.
    expect(typeof ref.current?.scrollTo).toBe('function');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('aria-label names the viewport as a region', async () => {
    const { container } = renderUI(
      <ScrollArea aria-label="Topics">
        <span>Design</span>
      </ScrollArea>,
    );

    const region = screen.getByRole('region', { name: 'Topics' });
    expect(region).toBe(viewportOf(container));
    expect(region).toHaveAccessibleName('Topics');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('aria-labelledby names the region from its heading', async () => {
    const { container } = renderUI(
      <section>
        <h3 id="conduct-heading">Code of conduct</h3>
        <ScrollArea aria-labelledby="conduct-heading">
          <p>Be kind.</p>
        </ScrollArea>
      </section>,
    );

    const region = screen.getByRole('region', { name: 'Code of conduct' });
    expect(region).toBe(viewportOf(container));
    expect(region).toHaveAttribute('aria-labelledby', 'conduct-heading');
    expect(region).not.toHaveAttribute('aria-label');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('left unnamed, the viewport is no region: its content speaks for itself', async () => {
    const { container } = renderUI(
      <ScrollArea>
        <button type="button">Attendee 1</button>
      </ScrollArea>,
    );

    expect(screen.queryByRole('region')).toBeNull();
    const viewport = viewportOf(container);
    expect(viewport).not.toHaveAttribute('role');
    expect(viewport).not.toHaveAttribute('aria-label');
    expect(viewport).not.toHaveAttribute('aria-labelledby');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('scrolls both ways by default', async () => {
    const { container } = renderUI(
      <ScrollArea>
        <p>Wide and tall</p>
      </ScrollArea>,
    );

    const viewport = viewportOf(container);
    expect(viewport.style.overflowX).toBe('scroll');
    expect(viewport.style.overflowY).toBe('scroll');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('orientation vertical scrolls only up and down, and the content takes the viewport width', async () => {
    const { container } = renderUI(
      <ScrollArea orientation="vertical">
        <p>Tall</p>
      </ScrollArea>,
    );

    const viewport = viewportOf(container);
    expect(viewport.style.overflowX).toBe('hidden');
    expect(viewport.style.overflowY).toBe('scroll');
    // Radix would size the content to its widest child; vertical pins it.
    expect(contentOf(container).style.display).toBe('block');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('orientation horizontal scrolls only sideways', async () => {
    const { container } = renderUI(
      <ScrollArea orientation="horizontal">
        <p>Wide</p>
      </ScrollArea>,
    );

    const viewport = viewportOf(container);
    expect(viewport.style.overflowX).toBe('scroll');
    expect(viewport.style.overflowY).toBe('hidden');
    expect(contentOf(container).style.display).not.toBe('block');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('content that fits keeps the viewport out of the tab order', async () => {
    mockSizes(fits);
    const { container } = renderUI(
      <ScrollArea aria-label="Code of conduct">
        <p>Short text.</p>
      </ScrollArea>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Code of conduct' });
    expect(region).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(region).not.toHaveFocus();
    expect(document.body).toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('an overflowing region with nothing to Tab to takes focus itself, so the keyboard can scroll it', async () => {
    mockSizes(overflowsVertically);
    const { container } = renderUI(
      <>
        <button type="button">Before</button>
        <ScrollArea aria-label="Code of conduct">
          <p>Long text with no controls in it.</p>
        </ScrollArea>
        <button type="button">After</button>
      </>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Code of conduct' });
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await userEvent.tab();
    expect(region).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(region).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(region).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('horizontal overflow alone is enough for the tab stop', async () => {
    mockSizes(overflowsHorizontally);
    const { container } = renderUI(
      <ScrollArea orientation="horizontal" aria-label="Topics">
        <span>Design</span>
        <span>Engineering</span>
      </ScrollArea>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Topics' });
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
    await userEvent.tab();
    expect(region).toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('an overflowing region with something to Tab to adds no tab stop of its own', async () => {
    mockSizes(overflowsVertically);
    const { container } = renderUI(
      <ScrollArea aria-label="Attendees">
        <button type="button">Attendee 1</button>
        <button type="button">Attendee 2</button>
      </ScrollArea>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Attendees' });
    expect(region).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Attendee 1' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Attendee 2' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Attendee 1' })).toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a link inside counts as something to Tab to', async () => {
    mockSizes(overflowsVertically);
    const { container } = renderUI(
      <ScrollArea aria-label="Code of conduct">
        <p>
          Report a problem to <a href="/staff">a staff member</a>.
        </p>
      </ScrollArea>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Code of conduct' });
    expect(region).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'a staff member' })).toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('content taken out of the tab order does not count: the region still takes focus', async () => {
    mockSizes(overflowsVertically);
    const { container } = renderUI(
      <ScrollArea aria-label="Code of conduct">
        <button type="button" tabIndex={-1}>
          Not a tab stop
        </button>
      </ScrollArea>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Code of conduct' });
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
    await userEvent.tab();
    expect(region).toHaveFocus();
    await userEvent.tab();
    expect(
      screen.getByRole('button', { name: 'Not a tab stop' }),
    ).not.toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('gives up its tab stop when tabbable content arrives, and takes it back when the content goes', async () => {
    mockSizes(overflowsVertically);
    const text = (
      <ScrollArea aria-label="Attendees">
        <p>Nobody yet.</p>
      </ScrollArea>
    );
    const { container, rerender } = renderUI(text);
    await settleObservers();

    const region = () => screen.getByRole('region', { name: 'Attendees' });
    await waitFor(() => expect(region()).toHaveAttribute('tabindex', '0'));

    rerender(
      <ScrollArea aria-label="Attendees">
        <button type="button">Attendee 1</button>
      </ScrollArea>,
    );
    await waitFor(() => expect(region()).not.toHaveAttribute('tabindex'));
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Attendee 1' })).toHaveFocus();

    rerender(text);
    await waitFor(() => expect(region()).toHaveAttribute('tabindex', '0'));
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('FlexScrollArea', () => {
  afterEach(unmockSizes);

  it('is a ScrollArea that can give up its height in a flex column', async () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = renderUI(
      <FlexScrollArea ref={ref} orientation="vertical" aria-label="Agenda">
        <p>09:00 Opening keynote</p>
      </FlexScrollArea>,
    );

    const viewport = viewportOf(container);
    const root = viewport.parentElement as HTMLElement;
    expect(root).toHaveClass('min-h-0');
    expect(ref.current).toBe(viewport);
    expect(screen.getByRole('region', { name: 'Agenda' })).toBe(viewport);
    expect(viewport.style.overflowX).toBe('hidden');
    expect(viewport.style.overflowY).toBe('scroll');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the caller className alongside its own', async () => {
    const { container } = renderUI(
      <FlexScrollArea className="w-full">
        <p>Sessions</p>
      </FlexScrollArea>,
    );

    const root = viewportOf(container).parentElement as HTMLElement;
    expect(root).toHaveClass('min-h-0');
    expect(root).toHaveClass('w-full');
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes focus itself when its overflowing content has nothing to Tab to', async () => {
    mockSizes(overflowsVertically);
    const { container } = renderUI(
      <FlexScrollArea aria-label="Agenda">
        <p>09:00 Opening keynote</p>
      </FlexScrollArea>,
    );
    await settleObservers();

    const region = screen.getByRole('region', { name: 'Agenda' });
    await waitFor(() => expect(region).toHaveAttribute('tabindex', '0'));
    await userEvent.tab();
    expect(region).toHaveFocus();
    await settleObservers();
    expect(await axe(container)).toHaveNoViolations();
  });
});
