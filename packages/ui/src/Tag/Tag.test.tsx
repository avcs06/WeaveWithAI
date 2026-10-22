import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Info } from 'lucide-react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Tag } from './Tag';
import { tagRecipe } from './Tag.recipes.css';

const { variants } = tagRecipe.classNames;

// jsdom has no layout: give the label's text and box widths so the tag can
// tell whether the label is cut.
const layout = (textWidth: number, boxWidth: number) => {
  const rect = (width: number) => ({ width }) as DOMRect;
  Range.prototype.getBoundingClientRect = () => rect(textWidth);
  jest
    .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
    .mockImplementation(() => rect(boxWidth));
};

// The ResizeObserver stub reports the first size in a microtask.
const measured = () => act(async () => undefined);

// Radix opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const tooltipEntries = async () => {
  await screen.findByRole('tooltip');
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

describe('Tag', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // @ts-expect-error jsdom has none; tests add one.
    delete Range.prototype.getBoundingClientRect;
  });

  it('shows its label, with the base, sm and bordered defaults', async () => {
    const { container } = renderUI(<Tag>Engineering</Tag>);
    const tag = container.firstElementChild;
    expect(tag).toHaveTextContent('Engineering');
    expect(tag).toHaveClass(
      variants.variant.base,
      variants.size.sm,
      variants.bordered.true,
    );
    expect(screen.queryByRole('button')).toBeNull();
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

  it('shows a left icon before the label and a right add-on after it', async () => {
    const { container } = renderUI(
      <Tag leftIcon={<Info data-testid="icon" />} rightAddOn={<span>12</span>}>
        Engineering
      </Tag>,
    );
    const tag = container.firstElementChild!;
    const iconElement = screen.getByTestId('icon');
    expect(tag.firstElementChild).toBe(iconElement);
    expect(iconElement).toHaveAttribute('data-slot', 'icon');
    expect(tag.lastElementChild).toHaveTextContent('12');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows its tooltip on hover', async () => {
    const { container } = renderUI(
      <Tag tooltip="Everyone who builds the product">Engineering</Tag>,
    );
    await userEvent.hover(container.firstElementChild!);
    expect(await tooltipEntries()).toEqual(['Everyone who builds the product']);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when closable: a close button named after the label', async () => {
    const onClose = jest.fn();
    const { container } = renderUI(
      <Tag closable onClose={onClose}>
        Engineering
      </Tag>,
    );
    const close = screen.getByRole('button', { name: 'Remove Engineering' });
    await userEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(container.firstElementChild).toHaveAttribute('data-closable');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: its close button ignores clicks and leaves the tab order', async () => {
    const onClose = jest.fn();
    const { container } = renderUI(
      <Tag disabled closable onClose={onClose}>
        Engineering
      </Tag>,
    );
    const close = screen.getByRole('button', { name: 'Remove Engineering' });
    expect(close).toHaveAttribute('aria-disabled', 'true');
    expect(close).toHaveAttribute('data-disabled');
    expect(close).toHaveAttribute('tabindex', '-1');
    await userEvent.click(close);
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: disabled, the reason under the tooltip', async () => {
    const { container } = renderUI(
      <Tag
        closable
        tooltip="Everyone who builds the product"
        disabledWithReason="Teams are locked"
      >
        Engineering
      </Tag>,
    );
    expect(
      screen.getByRole('button', { name: 'Remove Engineering' }),
    ).toHaveAttribute('aria-disabled', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-disabled');
    await userEvent.hover(container.firstElementChild!);
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
      'Teams are locked',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when cut: the full label in the tooltip, after its own', async () => {
    layout(200, 100);
    const { container } = renderUI(
      <Tag tooltip="Everyone who builds the product">
        Platform engineering and infrastructure
      </Tag>,
    );
    await measured();
    await userEvent.hover(container.firstElementChild!);
    expect(await tooltipEntries()).toEqual([
      'Everyone who builds the product',
      'Platform engineering and infrastructure',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('when the label fits: no tooltip', async () => {
    layout(100, 100);
    const { container } = renderUI(<Tag>Engineering</Tag>);
    await measured();
    await userEvent.hover(container.firstElementChild!);
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
