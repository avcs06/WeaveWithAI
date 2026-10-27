import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { createRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Controller } from '../Form';
import { axe, renderUI } from '../test-utils';

import { Textarea } from './Textarea';

import type { TextareaProps } from './Textarea.types';

const textbox = (name = 'Organizer notes') =>
  screen.getByRole('textbox', { name });

const box = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="box"]')!;

// The shown tooltip is `aria-hidden` (the control's description says it for
// screen readers), so role queries must include hidden elements.
const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

/** A Textarea that keeps its value. `delay` in these tests is always 800. */
const Notes = ({
  onChange,
  initial = '',
  ...props
}: Partial<TextareaProps<800>> & { initial?: string }) => {
  const [value, setValue] = useState(initial);
  return (
    <Textarea
      label="Organizer notes"
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};

describe('Textarea', () => {
  it('is a multi-line text field named by its label; onChange gets the text, Enter adds a line', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(<Notes onChange={onChange} />);
    const field = textbox();
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveAttribute('rows', '3');
    await userEvent.type(field, 'Line one{enter}Line two');
    expect(field).toHaveValue('Line one\nLine two');
    expect(onChange).toHaveBeenLastCalledWith('Line one\nLine two');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('rows says how many lines show before it scrolls', async () => {
    const { container } = renderUI(<Notes rows={6} />);
    expect(textbox()).toHaveAttribute('rows', '6');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('passes native attributes to the field, and className to the FormControl', () => {
    const { container } = renderUI(
      <Notes
        name="notes"
        maxLength={500}
        placeholder="Doors open at 6 pm"
        className="w-full"
      />,
    );
    const field = textbox();
    expect(field).toHaveAttribute('name', 'notes');
    expect(field).toHaveAttribute('maxlength', '500');
    expect(field).toHaveAttribute('placeholder', 'Doors open at 6 pm');
    // The placeholder is an example, not the name or the description.
    expect(field).toHaveAccessibleName('Organizer notes');
    expect(field).not.toHaveAccessibleDescription('Doors open at 6 pm');
    expect(container.firstElementChild).toHaveClass('w-full');
    expect(field).not.toHaveClass('w-full');
  });

  it('without a visible label, aria-label or aria-labelledby names it', async () => {
    const { container, rerender } = renderUI(
      <Textarea aria-label="Your reply" value="" onChange={() => undefined} />,
    );
    expect(screen.getByRole('textbox', { name: 'Your reply' })).toBe(
      container.querySelector('textarea'),
    );
    expect(await axe(container)).toHaveNoViolations();

    rerender(
      <>
        <h3 id="reply-heading">Reply to Grace Hopper</h3>
        <Textarea
          aria-labelledby="reply-heading"
          value=""
          onChange={() => undefined}
        />
      </>,
    );
    expect(
      screen.getByRole('textbox', { name: 'Reply to Grace Hopper' }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a new value from outside replaces the text', () => {
    const { rerender } = renderUI(
      <Textarea
        label="Organizer notes"
        value="First draft"
        onChange={() => undefined}
      />,
    );
    expect(textbox()).toHaveValue('First draft');
    rerender(
      <Textarea
        label="Organizer notes"
        value="Saved elsewhere"
        onChange={() => undefined}
      />,
    );
    expect(textbox()).toHaveValue('Saved elsewhere');
  });

  it('is one tab stop: Tab reaches it, Tab leaves it, Shift+Tab comes back', async () => {
    renderUI(
      <>
        <button type="button">Before</button>
        <Notes />
        <button type="button">After</button>
      </>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await user.tab();
    expect(textbox()).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(textbox()).toHaveFocus();
  });

  it('a click on the label focuses the field', async () => {
    renderUI(<Notes />);
    await userEvent.click(screen.getByText('Organizer notes'));
    expect(textbox()).toHaveFocus();
  });

  it('help text describes the field', async () => {
    const { container } = renderUI(
      <Notes helpText="Shown on the event page, above the schedule." />,
    );
    expect(textbox()).toHaveAccessibleDescription(
      'Shown on the event page, above the schedule.',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('labelRightSlot sits at the end of the label’s row, out of the description', async () => {
    const { container } = renderUI(
      <Notes labelRightSlot="0/500" helpText="Shown on the event page." />,
    );
    const row = container.querySelector('[data-slot="label-row"]')!;
    expect(row).toHaveTextContent('0/500');
    expect(textbox()).toHaveAccessibleDescription('Shown on the event page.');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('required: the mark after the label and aria-required, no native validation', async () => {
    const { container } = renderUI(<Notes required />);
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(textbox()).toHaveAttribute('aria-required', 'true');
    expect(textbox()).not.toHaveAttribute('required');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the hint: an info button named for the field, in the tab order before it, read as its description', async () => {
    renderUI(<Notes hint="Sent by email the day before" />);
    const hint = screen.getByRole('button', {
      name: 'About Organizer notes',
    });
    expect(hint).toHaveAccessibleDescription('Sent by email the day before');
    expect(textbox()).toHaveAccessibleDescription(
      'Sent by email the day before',
    );
    const user = userEvent.setup();
    await user.tab();
    expect(hint).toHaveFocus();
    expect(await tooltipEntries()).toEqual(['Sent by email the day before']);
    await user.tab();
    expect(textbox()).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('passes its ref to the field', () => {
    const ref = createRef<HTMLElement>();
    renderUI(<Notes ref={ref} />);
    expect(ref.current).toBe(textbox());
  });

  describe('status', () => {
    it('error: invalid, and its message describes the field', async () => {
      const { container } = renderUI(<Notes error="Describe the event" />);
      expect(textbox()).toBeInvalid();
      expect(textbox()).toHaveAttribute('aria-invalid', 'true');
      expect(textbox()).toHaveAccessibleDescription('Describe the event');
      expect(box(container)).toHaveAttribute('data-status', 'error');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('error wins over warning: only its message shows', async () => {
      const { container } = renderUI(
        <Notes
          error="Describe the event"
          warning="The printed program cuts this short"
        />,
      );
      expect(box(container)).toHaveAttribute('data-status', 'error');
      expect(textbox()).toBeInvalid();
      expect(textbox()).toHaveAccessibleDescription('Describe the event');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('warning: still valid, and its message describes the field', async () => {
      const { container } = renderUI(
        <Notes warning="The printed program shows the first 280 characters" />,
      );
      expect(textbox()).toBeValid();
      expect(textbox()).not.toHaveAttribute('aria-invalid');
      expect(textbox()).toHaveAccessibleDescription(
        'The printed program shows the first 280 characters',
      );
      expect(box(container)).toHaveAttribute('data-status', 'warning');
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('when it can’t be edited', () => {
    it('disabled: out of the tab order, read-only in place of native disabled, typing changes nothing', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Notes initial="Locked notes" disabled onChange={onChange} />
          <button type="button">After</button>
        </>,
      );
      const field = textbox();
      expect(field).toHaveAttribute('tabindex', '-1');
      expect(field).toHaveAttribute('aria-disabled', 'true');
      // Native `disabled` would block the box's tooltip.
      expect(field).not.toHaveAttribute('disabled');
      expect(field).toHaveAttribute('readonly');
      const user = userEvent.setup();
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.click(screen.getByText('Organizer notes'));
      expect(field).not.toHaveFocus();
      await userEvent.type(field, 'x');
      expect(field).toHaveValue('Locked notes');
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('disabledWithReason: keeps its tab stop so the reason is reachable, and the reason describes it', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Notes
          initial="Ada Lovelace, first programmer."
          disabledWithReason="Speakers write their own bios"
          onChange={onChange}
        />,
      );
      const field = textbox();
      expect(field).toHaveAttribute('tabindex', '0');
      expect(field).toHaveAttribute('aria-disabled', 'true');
      expect(field).not.toHaveAttribute('disabled');
      expect(field).toHaveAttribute('readonly');
      expect(field).toHaveAccessibleDescription(
        'Speakers write their own bios',
      );
      await userEvent.tab();
      expect(field).toHaveFocus();
      // Focusing it with the keyboard shows the reason, as on Button.
      expect(await tooltipEntries()).toEqual(['Speakers write their own bios']);
      await userEvent.type(field, 'x');
      expect(field).toHaveValue('Ada Lovelace, first programmer.');
      expect(onChange).not.toHaveBeenCalled();
      await userEvent.hover(box(container));
      expect(await tooltipEntries()).toEqual(['Speakers write their own bios']);
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('readOnly: keeps its tab stop so the text can be read and copied, typing changes nothing', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Notes
          initial="Load-in through the side door."
          readOnly
          onChange={onChange}
        />,
      );
      const field = textbox();
      expect(field).toHaveAttribute('tabindex', '0');
      expect(field).toHaveAttribute('aria-readonly', 'true');
      expect(field).not.toHaveAttribute('aria-disabled');
      expect(field).toHaveAttribute('readonly');
      await userEvent.tab();
      expect(field).toHaveFocus();
      await userEvent.type(field, 'x');
      expect(field).toHaveValue('Load-in through the side door.');
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('readOnlyWithReason: the reason describes it and shows over the box', async () => {
      const { container } = renderUI(
        <Notes
          initial="Load-in through the side door."
          readOnlyWithReason="Set by the venue"
        />,
      );
      const field = textbox();
      expect(field).toHaveAttribute('aria-readonly', 'true');
      expect(field).not.toHaveAttribute('aria-disabled');
      expect(field).toHaveAccessibleDescription('Set by the venue');
      await userEvent.tab();
      expect(field).toHaveFocus();
      await userEvent.hover(box(container));
      expect(await tooltipEntries()).toEqual(['Set by the venue']);
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('loading: busy and out of the tab order, with the spinner in the box', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Notes initial="Saving…" loading onChange={onChange} />,
      );
      const field = textbox();
      expect(field).toHaveAttribute('aria-busy', 'true');
      expect(field).toHaveAttribute('aria-disabled', 'true');
      expect(field).toHaveAttribute('tabindex', '-1');
      expect(field).toHaveAttribute('readonly');
      expect(
        box(container).querySelector('.lucide-loader-circle'),
      ).not.toBeNull();
      await userEvent.type(field, 'x');
      expect(field).toHaveValue('Saving…');
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('loadingWithReason: busy, keeps its tab stop, and the reason describes it', async () => {
      const { container } = renderUI(
        <Notes loadingWithReason="Checking for a saved draft" />,
      );
      const field = textbox();
      expect(field).toHaveAttribute('aria-busy', 'true');
      expect(field).toHaveAttribute('aria-disabled', 'true');
      expect(field).toHaveAttribute('tabindex', '0');
      expect(field).toHaveAccessibleDescription('Checking for a saved draft');
      await userEvent.tab();
      expect(field).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('loading with disableWhileLoading={false}: busy but still editable', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <Notes loading disableWhileLoading={false} onChange={onChange} />,
      );
      const field = textbox();
      expect(field).toHaveAttribute('aria-busy', 'true');
      expect(field).not.toHaveAttribute('aria-disabled');
      expect(field).not.toHaveAttribute('aria-readonly');
      expect(field).not.toHaveAttribute('readonly');
      expect(field).toHaveAttribute('tabindex', '0');
      await userEvent.type(field, 'Still typing');
      expect(field).toHaveValue('Still typing');
      expect(onChange).toHaveBeenLastCalledWith('Still typing');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('its own tooltip shows over the box, above the disabled reason, and both describe it', async () => {
      const { container } = renderUI(
        <Notes
          tooltip="Only organizers see this"
          disabledWithReason="Speakers write their own bios"
        />,
      );
      expect(textbox()).toHaveAccessibleDescription(
        'Only organizers see this Speakers write their own bios',
      );
      await userEvent.hover(box(container));
      expect(await tooltipEntries()).toEqual([
        'Only organizers see this',
        'Speakers write their own bios',
      ]);
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });

  describe('with delay', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const user = () =>
      userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

    it('shows what is typed at once, and sends it after the pause, once', async () => {
      const onChange = jest.fn();
      renderUI(<Notes delay={800} onChange={onChange} />);
      await user().type(textbox(), 'Draft notes');
      expect(textbox()).toHaveValue('Draft notes');
      expect(onChange).not.toHaveBeenCalled();
      await wait(799);
      expect(onChange).not.toHaveBeenCalled();
      await wait(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Draft notes');
    });

    it('typing again before the pause ends restarts the wait', async () => {
      const onChange = jest.fn();
      renderUI(<Notes delay={800} onChange={onChange} />);
      await user().type(textbox(), 'Dra');
      await wait(500);
      await user().type(textbox(), 'ft');
      await wait(500);
      expect(onChange).not.toHaveBeenCalled();
      await wait(300);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Draft');
    });

    it('leaving the field sends a waiting edit at once, before the caller’s onBlur', async () => {
      const onChange = jest.fn();
      const onBlur = jest.fn();
      renderUI(
        <>
          <Notes delay={800} onChange={onChange} onBlur={onBlur} />
          <button type="button">After</button>
        </>,
      );
      const session = user();
      await session.type(textbox(), 'Draft notes');
      expect(onChange).not.toHaveBeenCalled();
      await session.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Draft notes');
      expect(onBlur).toHaveBeenCalledTimes(1);
      expect(onChange.mock.invocationCallOrder[0]).toBeLessThan(
        onBlur.mock.invocationCallOrder[0],
      );
    });

    it('unmounting sends a waiting edit instead of dropping it', async () => {
      const onChange = jest.fn();
      const { unmount } = renderUI(<Notes delay={800} onChange={onChange} />);
      await user().type(textbox(), 'Draft notes');
      expect(onChange).not.toHaveBeenCalled();
      unmount();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Draft notes');
    });

    it('a new value from outside replaces the text, and no pending change undoes it', async () => {
      const onChange = jest.fn();
      const Harness = () => {
        const [value, setValue] = useState('Rock');
        return (
          <>
            <Textarea
              label="Organizer notes"
              delay={800}
              value={value}
              onChange={(next) => {
                setValue(next);
                onChange(next);
              }}
            />
            <button type="button" onClick={() => setValue('')}>
              Reset
            </button>
          </>
        );
      };
      renderUI(<Harness />);
      const session = user();
      await session.type(textbox(), 'y');
      expect(textbox()).toHaveValue('Rocky');
      await session.click(screen.getByRole('button', { name: 'Reset' }));
      // Leaving the field for the button flushed the waiting edit first;
      // the outside value then wins, and nothing is left waiting to undo it.
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('Rocky');
      expect(textbox()).toHaveValue('');
      await wait(800);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(textbox()).toHaveValue('');
    });
  });

  describe('with Controller', () => {
    const DescriptionForm = ({
      onSubmit,
    }: {
      onSubmit: (values: { description: string }) => void;
    }) => {
      const { control, handleSubmit } = useForm({
        mode: 'onChange',
        defaultValues: { description: '' },
      });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="description"
            control={control}
            rules={{
              required: 'Describe the event',
              maxLength: {
                value: 500,
                message: 'Keep it to 500 characters',
              },
            }}
          >
            {({ field }) => (
              <Textarea
                label="Description"
                helpText="Shown on the event page"
                {...field}
              />
            )}
          </Controller>
          <button type="submit">Save</button>
        </form>
      );
    };

    const description = () =>
      screen.getByRole('textbox', { name: 'Description' });

    it('{...field} is all it needs: the name, required, errors, and focus on a failed submit', async () => {
      const onSubmit = jest.fn();
      const { container } = renderUI(<DescriptionForm onSubmit={onSubmit} />);
      expect(description()).toHaveAttribute('name', 'description');
      expect(description()).toHaveAttribute('aria-required', 'true');

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(description()).toHaveFocus();
      expect(description()).toBeInvalid();
      expect(description()).toHaveAccessibleDescription(
        expect.stringContaining('Describe the event'),
      );
      expect(await axe(container)).toHaveNoViolations();

      await userEvent.type(description(), 'An evening of talks');
      expect(description()).toBeValid();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).toHaveBeenCalledWith(
        { description: 'An evening of talks' },
        expect.anything(),
      );
    });

    it('Enter adds a line instead of submitting the form', async () => {
      const onSubmit = jest.fn();
      renderUI(<DescriptionForm onSubmit={onSubmit} />);
      await userEvent.type(description(), 'First line{enter}Second line');
      expect(onSubmit).not.toHaveBeenCalled();
      expect(description()).toHaveValue('First line\nSecond line');
      expect(description()).toHaveFocus();
    });
  });
});
