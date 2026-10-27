import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ReactNode } from 'react';

import { Button } from '../Button';
import { axe, renderUI } from '../test-utils';

import { Tooltip } from './Tooltip';
import { TooltipProvider } from './TooltipProvider';

const trigger = (name = 'Save') => screen.getByRole('button', { name });

// The shown tooltip is aria-hidden: the trigger's description already says
// it to screen readers, so role queries include hidden elements to see it.
const findTooltip = () => screen.findByRole('tooltip', { hidden: true });
const getTooltip = () => screen.getByRole('tooltip', { hidden: true });
const queryTooltip = () => screen.queryByRole('tooltip', { hidden: true });
const getAllTooltips = () => screen.getAllByRole('tooltip', { hidden: true });

// The tooltip opens after a timer: wait past it before asserting that nothing opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

const wait = (ms: number) =>
  act(() => new Promise((resolve) => setTimeout(resolve, ms)));

// The app's delay; `renderUI` uses none.
const withAppDelay = (ui: ReactNode) => (
  <TooltipProvider delayDuration={200}>{ui}</TooltipProvider>
);

describe('Tooltip', () => {
  it('opens on hover and describes its trigger', async () => {
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
    expect(trigger()).toHaveAccessibleDescription('Saves a draft');
    // The tooltip is portalled out of `container`.
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('the shown tooltip stays out of the accessibility tree; the hidden description carries it', async () => {
    const { container } = renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    const tooltip = await findTooltip();
    // Sighted users see the tooltip; assistive tech gets it once, as the
    // trigger's description, never as a second stop in the tree.
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(tooltip).toHaveAttribute('data-state', 'delayed-open');
    // Portalled to the body, outside the trigger's own subtree.
    expect(document.body.contains(tooltip)).toBe(true);
    expect(container.contains(tooltip)).toBe(false);
    expect(container.contains(trigger())).toBe(true);
    // aria-describedby points at the hidden span holding the text.
    const describedBy = trigger().getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const description = document.getElementById(describedBy as string);
    expect(description).not.toBeNull();
    expect(description).toHaveAttribute('hidden');
    expect(description).toHaveTextContent('Saves a draft');
    expect(trigger()).toHaveAccessibleDescription('Saves a draft');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('places it where side and align say', async () => {
    renderUI(
      <Tooltip tooltip="Saves a draft" side="bottom" align="start">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    const tooltip = await findTooltip();
    expect(tooltip).toHaveAttribute('data-side', 'bottom');
    expect(tooltip).toHaveAttribute('data-align', 'start');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('describes its trigger before it shows, for screen readers that don’t hover or focus it', () => {
    renderUI(
      <Tooltip tooltip={['Saves a draft', 'No connection']}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(queryTooltip()).toBeNull();
    expect(trigger()).toHaveAccessibleDescription(
      'Saves a draft No connection',
    );
  });

  it('a description replaces what screen readers get; passed empty, there is none', async () => {
    const ui = (description?: string | null) => (
      <Tooltip
        tooltip={['Quarterly planning review', 'Locked']}
        description={description}
      >
        <button type="button">Save</button>
      </Tooltip>
    );
    const { rerender } = renderUI(ui('Locked'));
    expect(trigger()).toHaveAccessibleDescription('Locked');
    await userEvent.hover(trigger());
    expect(await findTooltip()).toHaveTextContent(
      'Quarterly planning reviewLocked',
    );

    for (const empty of [null, undefined]) {
      rerender(ui(empty));
      expect(trigger()).not.toHaveAttribute('aria-describedby');
    }
  });

  it('rich entries show as marked up; a plain description is what screen readers get', async () => {
    renderUI(
      <Tooltip
        tooltip={[<strong key="title">Early bird</strong>, 'Ends on 1 March']}
        description="Early bird tickets end on 1 March"
      >
        <button type="button">Save</button>
      </Tooltip>,
    );
    expect(trigger()).toHaveAccessibleDescription(
      'Early bird tickets end on 1 March',
    );
    await userEvent.hover(trigger());
    const tooltip = await findTooltip();
    expect(tooltip.querySelector('strong')).toHaveTextContent('Early bird');
    expect(tooltip).toHaveTextContent('Ends on 1 March');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('opens on keyboard focus and closes on Escape, before anything under it', async () => {
    const escapeBelow = jest.fn();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escapeBelow();
    };
    document.addEventListener('keydown', onKeyDown, { capture: true });
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.tab();
    expect(trigger()).toHaveFocus();
    expect(await findTooltip()).toBeInTheDocument();
    expect(getTooltip()).toHaveAttribute('data-state', 'instant-open');
    // The tooltip never takes focus itself.
    expect(trigger()).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(queryTooltip()).toBeNull();
    expect(escapeBelow).not.toHaveBeenCalled();
    // Escape dismisses the hint only: focus stays where the user put it.
    expect(trigger()).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    expect(escapeBelow).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', onKeyDown, { capture: true });
  });

  it('closes on blur: Tab moves on to the next control, Shift+Tab brings it back', async () => {
    const user = userEvent.setup();
    renderUI(
      <>
        <Tooltip tooltip="Saves a draft">
          <button type="button">Save</button>
        </Tooltip>
        <button type="button">Next</button>
      </>,
    );
    await user.tab();
    expect(trigger()).toHaveFocus();
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
    expect(await axe(document.body)).toHaveNoViolations();

    await user.tab();
    expect(trigger('Next')).toHaveFocus();
    expect(queryTooltip()).toBeNull();

    await user.tab({ shift: true });
    expect(trigger()).toHaveFocus();
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
  });

  it('stacks entries in order and skips empty ones', async () => {
    renderUI(
      <Tooltip tooltip={['Saves a draft', null, '', 'No connection']}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    await findTooltip();
    const entries = document.querySelectorAll('[data-side] > div');
    expect(Array.from(entries, (entry) => entry.textContent)).toEqual([
      'Saves a draft',
      'No connection',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('keeps the trigger, and its focus, as content comes and goes', () => {
    const ui = (tooltip?: string) => (
      <Tooltip tooltip={tooltip}>
        <button type="button">Save</button>
      </Tooltip>
    );
    const { rerender } = renderUI(ui());
    const element = trigger();
    element.focus();
    rerender(ui('Saves a draft'));
    expect(trigger()).toBe(element);
    expect(element).toHaveFocus();
    rerender(ui());
    expect(trigger()).toBe(element);
    expect(element).toHaveFocus();
  });

  it('never opens without content', async () => {
    renderUI(
      <Tooltip tooltip={[null, '']}>
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    await settle();
    expect(queryTooltip()).toBeNull();
    expect(trigger()).not.toHaveAttribute('aria-describedby');
  });

  it('keeps the open delay after an empty trigger is hovered', async () => {
    render(
      withAppDelay(
        <>
          <Tooltip tooltip={undefined}>
            <button type="button">Label</button>
          </Tooltip>
          <Tooltip tooltip="Saves a draft">
            <button type="button">Save</button>
          </Tooltip>
        </>,
      ),
    );
    const label = trigger('Label');
    await userEvent.hover(label);
    await wait(250);
    await userEvent.unhover(label);
    await wait(400);

    await userEvent.hover(trigger());
    await wait(50);
    expect(queryTooltip()).toBeNull();
    await wait(250);
    expect(getTooltip()).toHaveTextContent('Saves a draft');
  });

  it('one tooltip for every trigger: the next opens at once, in the same element', async () => {
    render(
      withAppDelay(
        <>
          <Tooltip tooltip="Saves a draft">
            <button type="button">Save</button>
          </Tooltip>
          <Tooltip tooltip="Publishes the event">
            <button type="button">Publish</button>
          </Tooltip>
        </>,
      ),
    );
    await userEvent.hover(trigger());
    const tooltip = await findTooltip();
    await userEvent.hover(trigger('Publish'));
    await waitFor(() =>
      expect(tooltip).toHaveTextContent('Publishes the event'),
    );
    expect(getAllTooltips()).toEqual([tooltip]);
    expect(trigger('Publish')).toHaveAccessibleDescription(
      'Publishes the event',
    );
    expect(trigger()).toHaveAccessibleDescription('Saves a draft');
  });

  it('after one closes, the next opens at once only within the skip window', async () => {
    render(
      withAppDelay(
        <>
          <Tooltip tooltip="Saves a draft">
            <button type="button">Save</button>
          </Tooltip>
          <Tooltip tooltip="Publishes the event">
            <button type="button">Publish</button>
          </Tooltip>
        </>,
      ),
    );
    await userEvent.hover(trigger());
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
    await userEvent.unhover(trigger());
    await waitFor(() => expect(queryTooltip()).toBeNull());

    // Right after: no delay to wait out again.
    await userEvent.hover(trigger('Publish'));
    await wait(50);
    expect(getTooltip()).toHaveTextContent('Publishes the event');
    expect(getTooltip()).toHaveAttribute('data-state', 'instant-open');
    await userEvent.unhover(trigger('Publish'));
    await waitFor(() => expect(queryTooltip()).toBeNull());

    // Once the skip window (300ms) lapses, the full delay is back.
    await wait(400);
    await userEvent.hover(trigger());
    await wait(50);
    expect(queryTooltip()).toBeNull();
    await wait(250);
    expect(getTooltip()).toHaveTextContent('Saves a draft');
    expect(getTooltip()).toHaveAttribute('data-state', 'delayed-open');
  });

  it('closes when the pointer leaves, and stays while the pointer is on the tooltip itself', async () => {
    const user = userEvent.setup();
    renderUI(
      <>
        <Tooltip tooltip="Saves a draft">
          <button type="button">Save</button>
        </Tooltip>
        <p>Elsewhere</p>
      </>,
    );
    await user.hover(trigger());
    const tooltip = await findTooltip();

    // Crossing onto the tooltip within the leave grace keeps it open.
    fireEvent.pointerLeave(trigger());
    fireEvent.pointerEnter(tooltip);
    await wait(200);
    expect(queryTooltip()).toBe(tooltip);

    fireEvent.pointerLeave(tooltip);
    await waitFor(() => expect(queryTooltip()).toBeNull());

    // Leaving the trigger for elsewhere closes it too.
    fireEvent.pointerMove(trigger(), { pointerType: 'mouse' });
    await findTooltip();
    await user.hover(screen.getByText('Elsewhere'));
    await waitFor(() => expect(queryTooltip()).toBeNull());
  });

  it('shows the trigger’s content as it changes, and closes when it empties', async () => {
    const ui = (tooltip?: string) => (
      <Tooltip tooltip={tooltip}>
        <button type="button">Save</button>
      </Tooltip>
    );
    const { rerender } = renderUI(ui('Saving'));
    await userEvent.hover(trigger());
    expect(await findTooltip()).toHaveTextContent('Saving');
    rerender(ui('Saved'));
    expect(getTooltip()).toHaveTextContent('Saved');
    rerender(ui());
    expect(queryTooltip()).toBeNull();
  });

  it('emptied while open: stays closed when content comes back, and keeps the open delay', async () => {
    const ui = (reason?: string) =>
      withAppDelay(
        <>
          <Tooltip tooltip={reason}>
            <button type="button">Publish</button>
          </Tooltip>
          <Tooltip tooltip="Saves a draft">
            <button type="button">Save</button>
          </Tooltip>
        </>,
      );
    const { rerender } = render(ui('Locked'));
    const publish = trigger('Publish');
    await userEvent.hover(publish);
    expect(await findTooltip()).toHaveTextContent('Locked');

    rerender(ui());
    expect(queryTooltip()).toBeNull();
    await userEvent.unhover(publish);
    await wait(400);
    rerender(ui('Locked'));
    await wait(50);
    expect(queryTooltip()).toBeNull();

    await userEvent.hover(trigger());
    await wait(50);
    expect(queryTooltip()).toBeNull();
    await wait(250);
    expect(getTooltip()).toHaveTextContent('Saves a draft');
  });

  it('a press closes it, and moving on the trigger doesn’t reopen it until the pointer comes back', async () => {
    // One pointer across the steps, so moving away leaves the trigger.
    const user = userEvent.setup();
    renderUI(
      <>
        <Tooltip tooltip="Saves a draft">
          <button type="button">Save</button>
        </Tooltip>
        <p>Elsewhere</p>
      </>,
    );
    await user.hover(trigger());
    await findTooltip();
    await user.click(trigger());
    await user.hover(trigger());
    await settle();
    expect(queryTooltip()).toBeNull();

    await user.hover(screen.getByText('Elsewhere'));
    await user.hover(trigger());
    expect(await findTooltip()).toBeInTheDocument();
  });

  it('a cancelled press shows it instead: a control disabled with a reason says why', async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    const { container } = renderUI(
      <Button
        variant="base"
        tooltip="Publishes to attendees"
        disabledWithReason="Add a venue before publishing"
        onClick={onClick}
      >
        Publish
      </Button>,
    );
    const publish = trigger('Publish');
    // Disabled with a reason keeps its tab stop, so the reason is reachable.
    expect(publish).toHaveAttribute('aria-disabled', 'true');
    expect(publish).toHaveAccessibleDescription(
      'Publishes to attendees Add a venue before publishing',
    );
    expect(await axe(container)).toHaveNoViolations();

    await user.click(publish);
    expect(onClick).not.toHaveBeenCalled();
    const tooltip = await findTooltip();
    expect(tooltip).toHaveTextContent('Publishes to attendees');
    expect(tooltip).toHaveTextContent('Add a venue before publishing');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('content that comes back opens on the next move over the trigger', async () => {
    const ui = (tooltip?: string) => (
      <Tooltip tooltip={tooltip}>
        <button type="button">Save</button>
      </Tooltip>
    );
    const { rerender } = renderUI(ui('Saves a draft'));
    await userEvent.hover(trigger());
    await findTooltip();
    rerender(ui());
    expect(queryTooltip()).toBeNull();
    rerender(ui('Saves a draft'));
    fireEvent.pointerMove(trigger(), { pointerType: 'mouse' });
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
  });

  it('a touch doesn’t open it', async () => {
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    fireEvent.pointerMove(trigger(), { pointerType: 'touch' });
    await settle();
    expect(queryTooltip()).toBeNull();
  });

  it('a scroll that moves the trigger closes it', async () => {
    renderUI(
      <Tooltip tooltip="Saves a draft">
        <button type="button">Save</button>
      </Tooltip>,
    );
    await userEvent.hover(trigger());
    await findTooltip();
    fireEvent.scroll(document);
    expect(queryTooltip()).toBeNull();
  });

  it('keeps the trigger’s own description next to its own', async () => {
    renderUI(
      <>
        <Tooltip tooltip="Saves a draft">
          <button type="button" aria-describedby="note">
            Save
          </button>
        </Tooltip>
        <p id="note">Unsaved changes</p>
      </>,
    );
    await userEvent.hover(trigger());
    await findTooltip();
    expect(trigger()).toHaveAccessibleDescription(
      'Unsaved changes Saves a draft',
    );
  });

  it('around a control with its own tooltip: the control’s shows, and the outer one when the control’s is empty', async () => {
    const user = userEvent.setup();
    const ui = (own?: string) => (
      <Tooltip tooltip="Outer">
        <Button variant="base" tooltip={own}>
          Save
        </Button>
      </Tooltip>
    );
    const { rerender } = renderUI(ui('Own'));
    await user.hover(trigger());
    expect(await findTooltip()).toHaveTextContent(/^Own$/);
    await user.unhover(trigger());
    await wait(150);

    rerender(ui());
    await user.hover(trigger());
    expect(await findTooltip()).toHaveTextContent(/^Outer$/);
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
    expect(await findTooltip()).toHaveTextContent('Saves a draft');
  });

  it('needs a TooltipProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    expect(() =>
      render(
        <Tooltip tooltip="Saves a draft">
          <button type="button">Save</button>
        </Tooltip>,
      ),
    ).toThrow('Tooltip needs a TooltipProvider; UIRoot has one');
    consoleError.mockRestore();
  });
});
