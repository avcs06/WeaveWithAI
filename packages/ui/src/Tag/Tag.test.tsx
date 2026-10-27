import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Info } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { axe, renderUI } from '../test-utils';

import { Tag } from './Tag';
import { tagRecipe } from './Tag.recipes.css';

const { variants } = tagRecipe.classNames;

// jsdom has no layout: the truncation check reads the label box width from
// its ResizeObserver and the text width from a Range. Report both here;
// installed before any tag renders, since the observer is shared.
let boxWidth = 1000;
globalThis.ResizeObserver = class {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    queueMicrotask(() =>
      act(() =>
        this.callback(
          [{ target, contentRect: { width: boxWidth } }] as unknown as
            ResizeObserverEntry[],
          this as unknown as ResizeObserver,
        ),
      ),
    );
  }
  unobserve = () => undefined;
  disconnect = () => undefined;
} as unknown as typeof ResizeObserver;

const layout = (textWidth: number, nextBoxWidth: number) => {
  boxWidth = nextBoxWidth;
  Range.prototype.getBoundingClientRect = () =>
    ({ width: textWidth }) as DOMRect;
};

// The ResizeObserver stub reports the first size in a microtask.
const measured = () => act(async () => undefined);

// Radix opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

const closeButton = (label = 'Engineering') =>
  screen.getByRole('button', { name: `Remove ${label}` });

describe('Tag', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    boxWidth = 1000;
    // @ts-expect-error jsdom has none; tests add one.
    delete Range.prototype.getBoundingClientRect;
  });

  it('shows its label, with the base, sm and bordered defaults, and takes no tab stop itself', async () => {
    const { container } = renderUI(<Tag>Engineering</Tag>);
    const tag = container.firstElementChild;
    expect(tag).toHaveTextContent('Engineering');
    expect(tag).toHaveClass(
      variants.variant.base,
      variants.size.sm,
      variants.bordered.true,
    );
    expect(screen.queryByRole('button')).toBeNull();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies variant, size and look', () => {
    const { container } = renderUI(
      <Tag variant="success" size="xs" look="!bordered">
        Paid
      </Tag>,
    );
    expect(container.firstElementChild).toHaveClass(
      variants.variant.success,
      variants.size.xs,
      variants.bordered.false,
    );
  });

  it('shows a left icon before the label and a right add-on after it, the icon hidden', async () => {
    const { container } = renderUI(
      <Tag leftIcon={<Info data-testid="icon" />} rightAddOn={<span>12</span>}>
        Engineering
      </Tag>,
    );
    const tag = container.firstElementChild!;
    const iconElement = screen.getByTestId('icon');
    expect(tag.firstElementChild).toBe(iconElement);
    expect(iconElement).toHaveAttribute('data-slot', 'icon');
    expect(iconElement).toHaveAttribute('aria-hidden', 'true');
    expect(tag.lastElementChild).toHaveTextContent('12');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows its tooltip on hover and describes the tag with it', async () => {
    const { container } = renderUI(
      <Tag tooltip="Everyone who builds the product">Engineering</Tag>,
    );
    expect(container.firstElementChild).toHaveAccessibleDescription(
      'Everyone who builds the product',
    );
    await userEvent.hover(screen.getByText('Engineering'));
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when closable: a close button named after the label, reached by Tab and pressed with Enter and Space', async () => {
    const onClose = jest.fn();
    const { container } = renderUI(
      <Tag closable onClose={onClose}>
        Engineering
      </Tag>,
    );
    const close = closeButton();
    expect(close).toHaveAttribute('data-slot', 'close');
    expect(container.firstElementChild).toHaveAttribute('data-closable');
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(onClose).toHaveBeenCalledTimes(2);
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when closable: focusing the close button shows its Remove tooltip', async () => {
    renderUI(
      <Tag closable onClose={jest.fn()}>
        Engineering
      </Tag>,
    );
    await userEvent.tab();
    expect(closeButton()).toHaveFocus();
    expect(await tooltipEntries()).toEqual(['Remove']);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('closeRef gives the caller the close button, to move focus before removing the tag', async () => {
    const Filters = () => {
      const [teams, setTeams] = useState(['Design', 'Engineering']);
      const buttons = useRef(new Map<string, HTMLButtonElement>());
      const remove = (team: string, index: number) => {
        const neighbor = teams[index + 1] ?? teams[index - 1];
        if (neighbor) buttons.current.get(neighbor)?.focus();
        setTeams((current) => current.filter((entry) => entry !== team));
      };
      return (
        <ul aria-label="Chosen teams">
          {teams.map((team, index) => (
            <li key={team}>
              <Tag
                closable
                closeRef={(node) => {
                  if (node) buttons.current.set(team, node);
                  return () => {
                    buttons.current.delete(team);
                  };
                }}
                onClose={() => remove(team, index)}
              >
                {team}
              </Tag>
            </li>
          ))}
        </ul>
      );
    };
    const { container } = renderUI(<Filters />);
    await userEvent.tab();
    expect(closeButton('Design')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    // Focus moved on before the focused button disappeared: never to <body>.
    expect(closeButton()).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Remove Design' })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('closeTabIndex={-1} keeps its close button out of the tab order, still pressable', async () => {
    const onClose = jest.fn();
    const { container } = renderUI(
      <Tag closable closeTabIndex={-1} onClose={onClose}>
        Engineering
      </Tag>,
    );
    const close = closeButton();
    expect(close).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    act(() => close.focus());
    await userEvent.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: its close button ignores clicks and keys and leaves the tab order', async () => {
    const onClose = jest.fn();
    const { container } = renderUI(
      <Tag disabled closable onClose={onClose}>
        Engineering
      </Tag>,
    );
    const close = closeButton();
    expect(close).toHaveAttribute('aria-disabled', 'true');
    expect(close).toHaveAttribute('data-disabled');
    expect(close).toHaveAttribute('tabindex', '-1');
    expect(close).not.toBeDisabled();
    await userEvent.click(close);
    act(() => close.focus());
    await userEvent.keyboard('{Enter} ');
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: the close button keeps its tab stop and reads the reason', async () => {
    const onClose = jest.fn();
    const { container } = renderUI(
      <Tag closable disabledWithReason="Set by your workspace" onClose={onClose}>
        Region: Europe
      </Tag>,
    );
    const close = closeButton('Region: Europe');
    expect(close).toHaveAttribute('aria-disabled', 'true');
    expect(close).toHaveAttribute('data-disabled');
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    // A reason must be reachable by keyboard: no tabindex="-1".
    expect(close).not.toHaveAttribute('tabindex', '-1');
    expect(close).toHaveAccessibleDescription('Set by your workspace');
    await userEvent.tab();
    expect(close).toHaveFocus();
    expect(await tooltipEntries()).toEqual([
      'Remove',
      'Set by your workspace',
    ]);
    await userEvent.keyboard('{Enter} ');
    await userEvent.click(close);
    expect(onClose).not.toHaveBeenCalled();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('with a disabled reason and its own tooltip: hovering the label stacks tooltip and reason', async () => {
    const { container } = renderUI(
      <Tag
        closable
        tooltip="Everyone who builds the product"
        disabledWithReason="Teams are locked"
      >
        Engineering
      </Tag>,
    );
    expect(closeButton()).toHaveAttribute('aria-disabled', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    await userEvent.hover(screen.getByText('Engineering'));
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
      'Teams are locked',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('with a disabled reason and no close button: marked disabled, tooltip and reason on hover and in its description', async () => {
    const { container } = renderUI(
      <Tag
        tooltip="Everyone who builds the product"
        disabledWithReason="Teams are locked"
      >
        Engineering
      </Tag>,
    );
    const tag = container.firstElementChild;
    expect(tag).toHaveAttribute('data-disabled');
    expect(screen.queryByRole('button')).toBeNull();
    expect(tag).toHaveAccessibleDescription(
      'Everyone who builds the product Teams are locked',
    );
    // Nothing in it can take focus: the reason is hover-only here.
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    await userEvent.hover(screen.getByText('Engineering'));
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
      'Teams are locked',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when cut: the full label in the tooltip, after its own, but not in the description', async () => {
    layout(200, 100);
    const { container } = renderUI(
      <Tag tooltip="Everyone who builds the product">
        Platform engineering and infrastructure
      </Tag>,
    );
    await measured();
    // The full label stays in the page text; only the tooltip carries it
    // visually, so the description keeps only the tag's own tooltip.
    expect(container.firstElementChild).toHaveAccessibleDescription(
      'Everyone who builds the product',
    );
    await userEvent.hover(
      screen.getByText('Platform engineering and infrastructure'),
    );
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
      'Platform engineering and infrastructure',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when cut with no tooltip of its own: the full label alone', async () => {
    layout(200, 100);
    renderUI(<Tag>Platform engineering and infrastructure</Tag>);
    await measured();
    await userEvent.hover(
      screen.getByText('Platform engineering and infrastructure'),
    );
    expect(await tooltipEntries()).toEqual([
      'Platform engineering and infrastructure',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when cut on a closable tag: its tooltip, the full label and the reason on the label', async () => {
    layout(200, 100);
    renderUI(
      <Tag
        closable
        tooltip="Everyone who builds the product"
        disabledWithReason="Teams are locked"
      >
        Platform engineering and infrastructure
      </Tag>,
    );
    await measured();
    await userEvent.hover(
      screen.getByText('Platform engineering and infrastructure'),
    );
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
      'Platform engineering and infrastructure',
      'Teams are locked',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when the label fits: no tooltip', async () => {
    layout(100, 100);
    const { container } = renderUI(<Tag>Engineering</Tag>);
    await measured();
    await userEvent.hover(screen.getByText('Engineering'));
    await settle();
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute(
      'aria-describedby',
    );
  });
});
