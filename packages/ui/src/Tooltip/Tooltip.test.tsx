import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Tooltip } from './Tooltip';

const trigger = () => screen.getByRole('button', { name: 'Save' });

// Radix opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

describe('Tooltip', () => {
  it('opens on hover and describes its trigger', async () => {
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Saves a draft',
    );
    expect(trigger()).toHaveAccessibleDescription('Saves a draft');
    // The tooltip is portalled out of `container`.
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('opens on keyboard focus and closes on Escape', async () => {
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stacks entries in order and skips empty ones', async () => {
    renderUI(
      <Tooltip tooltip={['Saves a draft', null, '', 'No connection']}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    await screen.findByRole('tooltip');
    const entries = document.querySelectorAll('[data-side] > div');
    expect(Array.from(entries, (entry) => entry.textContent)).toEqual([
      'Saves a draft',
      'No connection',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('without content: renders the trigger alone', async () => {
    const { container } = renderUI(
      <Tooltip tooltip={[null, '']}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(trigger()).not.toHaveAttribute('data-state');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps the open delay after an empty trigger is hovered', async () => {
    const wait = (ms: number) =>
      act(() => new Promise((resolve) => setTimeout(resolve, ms)));
    // The app's delay; `renderUI` uses none.
    render(
      <TooltipPrimitive.Provider delayDuration={200}>
        <Tooltip tooltip={undefined}>
          <button type="button">Label</button>
        </Tooltip>
        <Tooltip tooltip="Saves a draft">
          <button type="button">Save</button>
        </Tooltip>
      </TooltipPrimitive.Provider>,
    );
    const label = screen.getByRole('button', { name: 'Label' });
    await userEvent.hover(label);
    await wait(250);
    await userEvent.unhover(label);
    await wait(400);

    await userEvent.hover(trigger());
    await wait(50);
    expect(screen.queryByRole('tooltip')).toBeNull();
    await wait(250);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Saves a draft');
  });

  it('never opens without content', async () => {
    renderUI(
      <Tooltip tooltip={[null, '']}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(trigger()).not.toHaveAttribute('aria-describedby');
  });

  it("doesn't reopen on its own when content comes back", async () => {
    const ui = (tooltip?: string) => (
      <>
        <Tooltip tooltip={tooltip}>
          <button type="button">Save</button>
        </Tooltip>
        <button type="button">Elsewhere</button>
      </>
    );
    const { rerender } = renderUI(ui('Saves a draft'));
    await userEvent.tab();
    await screen.findByRole('tooltip');
    rerender(ui(undefined));
    await userEvent.tab();
    rerender(ui('Saves a draft'));
    await settle();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('portals by default; portal={false} renders beside the trigger', async () => {
    const { container, rerender } = renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    await screen.findByRole('tooltip');
    expect(container.querySelector('[data-side]')).toBeNull();

    rerender(
      <Tooltip tooltip="Saves a draft" portal={false}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(container.querySelector('[data-side]')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('works with a component that passes its props to an element', async () => {
    const Save = (props: React.ComponentProps<'button'>) => (
      <button type="button" {...props}>
        Save
      </button>
    );
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <Save />
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Saves a draft',
    );
  });
});
