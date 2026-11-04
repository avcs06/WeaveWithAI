import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../Button';
import { Controller } from '../Form';
import { axe, renderUI } from '../test-utils';

import { checkboxRecipe } from './Checkbox.recipes.css';

import { Checkbox, CheckboxGroup, type CheckboxProps } from '.';

import type { DisabledState, ReadOnlyState } from '../utils';

const { variants } = checkboxRecipe.classNames;

const checkbox = (name: string | RegExp) =>
  screen.getByRole('checkbox', { name });

const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

/** One controlled box, as the recipe's consent and setting examples. */
const OneBox = ({
  initial = false,
  ...props
}: {
  initial?: boolean;
} & Omit<
  React.ComponentProps<typeof Checkbox>,
  | 'checked'
  | 'onCheckedChange'
  | 'disabled'
  | 'disabledWithReason'
  | 'readOnly'
  | 'readOnlyWithReason'
> &
  DisabledState &
  ReadOnlyState) => {
  const [checked, setChecked] = useState(initial);
  // Omit over the props' unions collapses them; `checked` is supplied here.
  return (
    <Checkbox
      {...(props as CheckboxProps)}
      checked={checked}
      onCheckedChange={setChecked}
    />
  );
};

describe('Checkbox', () => {
  it('is a checkbox named by its label, reporting its checked state', async () => {
    const { container } = renderUI(
      <>
        <OneBox>I agree to the code of conduct</OneBox>
        <OneBox initial>Email me a reminder</OneBox>
      </>,
    );
    const agree = checkbox('I agree to the code of conduct');
    expect(agree).toHaveAttribute('aria-checked', 'false');
    expect(agree).toHaveAttribute('tabindex', '0');
    expect(checkbox('Email me a reminder')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(
      screen.getByText('I agree to the code of conduct').closest('label'),
    ).toHaveAttribute('for', agree.id);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggles on a click on the box, on its label, and on Space — not on Enter', async () => {
    const { container } = renderUI(<OneBox>Reminder</OneBox>);
    const box = checkbox('Reminder');

    await userEvent.click(box);
    expect(box).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByText('Reminder'));
    expect(box).toHaveAttribute('aria-checked', 'false');

    await userEvent.tab();
    expect(box).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(box).toHaveAttribute('aria-checked', 'true');
    // Enter submits a form; it never toggles a checkbox.
    await userEvent.keyboard('{Enter}');
    expect(box).toHaveAttribute('aria-checked', 'true');
    expect(box).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is in the tab order between its neighbours, both ways', async () => {
    renderUI(
      <>
        <button>Before</button>
        <OneBox>Reminder</OneBox>
        <button>After</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await userEvent.tab();
    expect(checkbox('Reminder')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(checkbox('Reminder')).toHaveFocus();
  });

  it('applies size and variant, defaulting to sm and default', () => {
    renderUI(
      <>
        <OneBox>Plain</OneBox>
        <OneBox size="md" variant="base">
          Large base
        </OneBox>
      </>,
    );
    expect(checkbox('Plain')).toHaveClass(
      variants.size.sm,
      variants.variant.default,
    );
    expect(checkbox('Large base')).toHaveClass(
      variants.size.md,
      variants.variant.base,
    );
  });

  it('required: the mark after the label, and aria-required', async () => {
    const { container } = renderUI(
      <OneBox required>I agree to the code of conduct</OneBox>,
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(checkbox('I agree to the code of conduct')).toHaveAttribute(
      'aria-required',
      'true',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('indeterminate reads as mixed; a press on it checks the box', async () => {
    const onCheckedChange = jest.fn();
    const { container } = renderUI(
      <Checkbox checked="indeterminate" onCheckedChange={onCheckedChange}>
        All sessions
      </Checkbox>,
    );
    const box = checkbox('All sessions');
    expect(box).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(box);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    box.focus();
    await userEvent.keyboard('[Space]');
    expect(onCheckedChange).toHaveBeenLastCalledWith(true);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes its name from aria-label or aria-labelledby instead of a label', async () => {
    const { container } = renderUI(
      <>
        <OneBox aria-label="Select row 3" />
        <span id="row-4">Select row 4</span>
        <OneBox aria-labelledby="row-4" />
      </>,
    );
    expect(checkbox('Select row 3')).toHaveAttribute('tabindex', '0');
    expect(checkbox('Select row 4')).toHaveAttribute('aria-checked', 'false');
    await userEvent.tab();
    expect(checkbox('Select row 3')).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(checkbox('Select row 3')).toHaveAttribute('aria-checked', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the hint describes the box, and its info button is the next tab stop', async () => {
    const { container } = renderUI(
      <OneBox hint="Be kind, and report harassment">
        I agree to the code of conduct
      </OneBox>,
    );
    const box = checkbox('I agree to the code of conduct');
    expect(box).toHaveAccessibleDescription('Be kind, and report harassment');
    const hint = screen.getByRole('button', {
      name: 'About I agree to the code of conduct',
    });
    await userEvent.tab();
    expect(box).toHaveFocus();
    await userEvent.tab();
    expect(hint).toHaveFocus();
    await userEvent.hover(hint);
    expect(await tooltipEntries()).toEqual(['Be kind, and report harassment']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('the tooltip describes the box and shows on hover, above any reason', async () => {
    renderUI(
      <OneBox
        tooltip="Sent at 9:00 in the event's time zone"
        disabledWithReason="Your ticket has no reminder"
      >
        Email me a reminder
      </OneBox>,
    );
    const box = checkbox('Email me a reminder');
    expect(box).toHaveAccessibleDescription(
      "Sent at 9:00 in the event's time zone Your ticket has no reminder",
    );
    await userEvent.hover(box);
    expect(await tooltipEntries()).toEqual([
      "Sent at 9:00 in the event's time zone",
      'Your ticket has no reminder',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('submits its value under its name while checked; a disabled box submits nothing', async () => {
    const { container } = renderUI(
      <form>
        <OneBox name="reminder" value="yes" initial>
          Reminder
        </OneBox>
        <OneBox name="tour" value="yes" disabled initial>
          Boat tour
        </OneBox>
      </form>,
    );
    const submitted = container.querySelector<HTMLInputElement>(
      'input[name="reminder"]',
    )!;
    expect(submitted).toHaveAttribute('value', 'yes');
    expect(submitted).toBeChecked();
    expect(container.querySelector('input[name="tour"]')).toBeNull();
    await userEvent.click(checkbox('Reminder'));
    expect(submitted).not.toBeChecked();
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('when it cannot be changed', () => {
    it('disabled silently: out of the tab order, and no press changes it', async () => {
      const onCheckedChange = jest.fn();
      const { container } = renderUI(
        <>
          <Checkbox checked={false} onCheckedChange={onCheckedChange} disabled>
            Recording of every session
          </Checkbox>
          <OneBox>Lunch</OneBox>
        </>,
      );
      const box = checkbox('Recording of every session');
      expect(box).toHaveAttribute('aria-disabled', 'true');
      expect(box).toHaveAttribute('tabindex', '-1');

      await userEvent.tab();
      expect(checkbox('Lunch')).toHaveFocus();

      await userEvent.click(box);
      await userEvent.click(screen.getByText('Recording of every session'));
      box.focus();
      await userEvent.keyboard('[Space]{Enter}');
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(box).toHaveAttribute('aria-checked', 'false');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('disabled with a reason: it keeps its tab stop so the reason is reachable', async () => {
      const onCheckedChange = jest.fn();
      renderUI(
        <>
          <Checkbox
            checked={false}
            onCheckedChange={onCheckedChange}
            disabledWithReason="The tour is fully booked"
          >
            Evening boat tour
          </Checkbox>
          <OneBox>Lunch</OneBox>
        </>,
      );
      const box = checkbox('Evening boat tour');
      expect(box).toHaveAttribute('aria-disabled', 'true');
      expect(box).toHaveAttribute('tabindex', '0');
      expect(box).toHaveAccessibleDescription('The tour is fully booked');

      await userEvent.tab();
      expect(box).toHaveFocus();
      await userEvent.hover(box);
      expect(await tooltipEntries()).toEqual(['The tour is fully booked']);
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.keyboard('[Space]{Enter}');
      await userEvent.click(box);
      await userEvent.click(screen.getByText('Evening boat tour'));
      expect(onCheckedChange).not.toHaveBeenCalled();
      box.focus();
      await userEvent.tab();
      expect(checkbox('Lunch')).toHaveFocus();
    });

    it('read-only silently: aria-readonly, not disabled, and no press changes it', async () => {
      const onCheckedChange = jest.fn();
      const { container } = renderUI(
        <Checkbox checked onCheckedChange={onCheckedChange} readOnly>
          Lunch on both days
        </Checkbox>,
      );
      const box = checkbox('Lunch on both days');
      expect(box).toHaveAttribute('aria-readonly', 'true');
      expect(box).not.toHaveAttribute('aria-disabled');
      expect(box).toHaveAttribute('tabindex', '-1');
      await userEvent.click(box);
      await userEvent.click(screen.getByText('Lunch on both days'));
      box.focus();
      await userEvent.keyboard('[Space]');
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(box).toHaveAttribute('aria-checked', 'true');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('read-only with a reason: it keeps its tab stop, and the reason is read', async () => {
      const onCheckedChange = jest.fn();
      renderUI(
        <Checkbox
          checked
          onCheckedChange={onCheckedChange}
          readOnlyWithReason="Included with the VIP ticket"
        >
          Lunch on both days
        </Checkbox>,
      );
      const box = checkbox('Lunch on both days');
      expect(box).toHaveAttribute('aria-readonly', 'true');
      expect(box).not.toHaveAttribute('aria-disabled');
      expect(box).toHaveAttribute('tabindex', '0');
      expect(box).toHaveAccessibleDescription('Included with the VIP ticket');

      await userEvent.tab();
      expect(box).toHaveFocus();
      await userEvent.hover(box);
      expect(await tooltipEntries()).toEqual(['Included with the VIP ticket']);
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.keyboard('[Space]');
      await userEvent.click(box);
      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });
});

describe('CheckboxGroup', () => {
  const Channels = ({
    initial = ['email'],
    onChange,
    ...props
  }: {
    initial?: string[];
    onChange?: (value: string[]) => void;
  } & Omit<
    React.ComponentProps<typeof CheckboxGroup>,
    | 'value'
    | 'onChange'
    | 'label'
    | 'children'
    | 'disabled'
    | 'disabledWithReason'
    | 'readOnly'
    | 'readOnlyWithReason'
  > &
    DisabledState &
    ReadOnlyState) => {
    const [value, setValue] = useState(initial);
    const change = (next: string[]) => {
      setValue(next);
      onChange?.(next);
    };
    return (
      <CheckboxGroup
        label="Send ticket updates by"
        {...props}
        value={value}
        onChange={change}
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
        <Checkbox value="push">App notification</Checkbox>
      </CheckboxGroup>
    );
  };

  const group = (name = 'Send ticket updates by') =>
    screen.getByRole('group', { name });

  it('is a group named by its label; the group value decides each box', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(<Channels onChange={onChange} />);
    expect(checkbox('Email')).toHaveAttribute('aria-checked', 'true');
    expect(checkbox('Text message')).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(checkbox('Text message'));
    expect(onChange).toHaveBeenLastCalledWith(['email', 'sms']);
    expect(checkbox('Text message')).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByText('Email'));
    expect(onChange).toHaveBeenLastCalledWith(['sms']);
    expect(checkbox('Email')).toHaveAttribute('aria-checked', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('every box is its own tab stop, and Space toggles the focused one', async () => {
    const { container } = renderUI(<Channels initial={[]} />);
    await userEvent.tab();
    expect(checkbox('Email')).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(checkbox('Email')).toHaveAttribute('aria-checked', 'true');
    await userEvent.tab();
    expect(checkbox('Text message')).toHaveFocus();
    await userEvent.tab();
    expect(checkbox('App notification')).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(checkbox('Text message')).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a press on the group label focuses the group, then Tab reaches the boxes', async () => {
    renderUI(<Channels helpText="Schedule changes and your check-in code" />);
    expect(group()).toHaveAttribute('tabindex', '-1');
    expect(group()).toHaveAccessibleDescription(
      'Schedule changes and your check-in code',
    );
    await userEvent.click(screen.getByText('Send ticket updates by'));
    expect(group()).toHaveFocus();
    await userEvent.tab();
    expect(checkbox('Email')).toHaveFocus();
  });

  it('takes an aria-label instead of a visible label', async () => {
    const { container } = renderUI(
      <CheckboxGroup aria-label="Sessions" value={[]} onChange={jest.fn()}>
        <Checkbox value="keynote">Opening keynote</Checkbox>
      </CheckboxGroup>,
    );
    expect(group('Sessions')).toBeInTheDocument();
    expect(checkbox('Opening keynote')).toHaveAttribute('tabindex', '0');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('required marks the label; the error describes the group, ahead of the help text', async () => {
    const { container } = renderUI(
      <Channels
        required
        helpText="Schedule changes and your check-in code"
        error="Pick at least one channel"
      />,
    );
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Pick at least one channel')).toBeInTheDocument();
    expect(group()).toHaveAccessibleDescription(
      'Pick at least one channel Schedule changes and your check-in code',
    );
    // A plain group has no aria-required or aria-invalid: its mark is on the
    // label, its message is its description.
    expect(group()).not.toHaveAttribute('aria-required');
    expect(group()).not.toHaveAttribute('aria-invalid');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows a warning, then a success, as the group’s message', async () => {
    const { container, rerender } = renderUI(
      <Channels warning="Your carrier may charge for texts" />,
    );
    expect(group()).toHaveAccessibleDescription(
      'Your carrier may charge for texts',
    );
    rerender(<Channels success="Saved to your profile" />);
    expect(screen.getByText('Saved to your profile')).toBeInTheDocument();
    expect(group()).toHaveAccessibleDescription('Saved to your profile');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('runs onBlur only once focus leaves the group', async () => {
    const onBlur = jest.fn();
    renderUI(
      <>
        <Channels onBlur={onBlur} />
        <button>After</button>
      </>,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(checkbox('Text message')).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  describe('when a box or the group cannot be changed', () => {
    it('a silently disabled box leaves the tab order; one with a reason keeps its stop', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <CheckboxGroup label="Workshops" value={[]} onChange={onChange}>
          <Checkbox value="figma">Figma for developers</Checkbox>
          <Checkbox value="testing" disabled>
            Testing with screen readers
          </Checkbox>
          <Checkbox value="vue" disabledWithReason="Cancelled by the speaker">
            Vue for React developers
          </Checkbox>
        </CheckboxGroup>,
      );
      const silent = checkbox('Testing with screen readers');
      const withReason = checkbox('Vue for React developers');
      expect(silent).toHaveAttribute('aria-disabled', 'true');
      expect(silent).toHaveAttribute('tabindex', '-1');
      expect(withReason).toHaveAttribute('aria-disabled', 'true');
      expect(withReason).toHaveAttribute('tabindex', '0');
      expect(withReason).toHaveAccessibleDescription(
        'Cancelled by the speaker',
      );

      await userEvent.tab();
      expect(checkbox('Figma for developers')).toHaveFocus();
      await userEvent.tab();
      expect(withReason).toHaveFocus();
      await userEvent.keyboard('[Space]');
      await userEvent.click(silent);
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a silently disabled group: every box is out of the tab order', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Channels disabled onChange={onChange} />
          <button>After</button>
        </>,
      );
      for (const name of ['Email', 'Text message', 'App notification']) {
        expect(checkbox(name)).toHaveAttribute('aria-disabled', 'true');
        expect(checkbox(name)).toHaveAttribute('tabindex', '-1');
      }
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.click(checkbox('Text message'));
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a group disabled with a reason: each box shows it, and its own reason wins', async () => {
      const onChange = jest.fn();
      renderUI(
        <CheckboxGroup
          label="Workshops"
          value={['figma']}
          onChange={onChange}
          disabledWithReason="Registration closed on May 1"
        >
          <Checkbox value="figma">Figma for developers</Checkbox>
          <Checkbox
            value="testing"
            disabledWithReason="Cancelled by the speaker"
          >
            Testing with screen readers
          </Checkbox>
        </CheckboxGroup>,
      );
      const figma = checkbox('Figma for developers');
      const testing = checkbox('Testing with screen readers');
      expect(figma).toHaveAccessibleDescription('Registration closed on May 1');
      expect(testing).toHaveAccessibleDescription('Cancelled by the speaker');
      expect(group('Workshops')).toHaveAccessibleDescription(
        'Registration closed on May 1',
      );
      for (const box of [figma, testing]) {
        expect(box).toHaveAttribute('aria-disabled', 'true');
        expect(box).toHaveAttribute('tabindex', '0');
      }
      await userEvent.tab();
      expect(figma).toHaveFocus();
      await userEvent.keyboard('[Space]');
      await userEvent.click(testing);
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('a read-only group: its boxes are read-only, not disabled; a reason keeps their stops', async () => {
      const onChange = jest.fn();
      const { container, rerender } = renderUI(
        <Channels
          readOnlyWithReason="Set by your ticket"
          onChange={onChange}
        />,
      );
      for (const name of ['Email', 'Text message']) {
        expect(checkbox(name)).toHaveAttribute('aria-readonly', 'true');
        expect(checkbox(name)).not.toHaveAttribute('aria-disabled');
        expect(checkbox(name)).toHaveAttribute('tabindex', '0');
        expect(checkbox(name)).toHaveAccessibleDescription(
          'Set by your ticket',
        );
      }
      await userEvent.tab();
      expect(checkbox('Email')).toHaveFocus();
      await userEvent.keyboard('[Space]');
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();

      rerender(<Channels readOnly onChange={onChange} />);
      expect(checkbox('Email')).toHaveAttribute('aria-readonly', 'true');
      expect(checkbox('Email')).toHaveAttribute('tabindex', '-1');
    });

    it('a box’s own read-only reason wins over its group’s', async () => {
      const { container } = renderUI(
        <CheckboxGroup
          label="Extras"
          value={['lunch']}
          onChange={jest.fn()}
          readOnlyWithReason="Set by your ticket"
        >
          <Checkbox value="lunch" readOnlyWithReason="Included with VIP">
            Lunch
          </Checkbox>
          <Checkbox value="tour">Boat tour</Checkbox>
        </CheckboxGroup>,
      );
      expect(checkbox('Lunch')).toHaveAccessibleDescription(
        'Included with VIP',
      );
      expect(checkbox('Boat tour')).toHaveAccessibleDescription(
        'Set by your ticket',
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it('a “select all” parent is mixed while its group is partly checked', async () => {
    const sessions = [
      { id: 'keynote', title: 'Opening keynote' },
      { id: 'design', title: 'Design systems at scale' },
    ];
    const SelectAll = () => {
      const [selected, setSelected] = useState<string[]>(['keynote']);
      const allChecked =
        selected.length === sessions.length
          ? true
          : selected.length > 0
            ? 'indeterminate'
            : false;
      return (
        <>
          <Checkbox
            checked={allChecked}
            onCheckedChange={(checked) =>
              setSelected(checked ? sessions.map((session) => session.id) : [])
            }
          >
            All sessions
          </Checkbox>
          <CheckboxGroup
            aria-label="Sessions"
            value={selected}
            onChange={setSelected}
          >
            {sessions.map((session) => (
              <Checkbox key={session.id} value={session.id}>
                {session.title}
              </Checkbox>
            ))}
          </CheckboxGroup>
        </>
      );
    };
    const { container } = renderUI(<SelectAll />);
    const parent = checkbox('All sessions');
    expect(parent).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(parent);
    expect(parent).toHaveAttribute('aria-checked', 'true');
    expect(checkbox('Design systems at scale')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(checkbox('Opening keynote'));
    expect(parent).toHaveAttribute('aria-checked', 'mixed');
    await userEvent.click(parent);
    await userEvent.click(parent);
    expect(parent).toHaveAttribute('aria-checked', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('in a form through Controller: required and error from its rules, focus on a failed submit', async () => {
    const onSubmit = jest.fn();
    const Preferences = () => {
      const { control, handleSubmit } = useForm<{ channels: string[] }>({
        defaultValues: { channels: [] },
      });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="channels"
            control={control}
            rules={{ required: 'Pick at least one channel' }}
          >
            {({ field }) => (
              <CheckboxGroup
                label="Send ticket updates by"
                helpText="Schedule changes and your check-in code"
                {...field}
              >
                <Checkbox value="email">Email</Checkbox>
                <Checkbox value="sms">Text message</Checkbox>
              </CheckboxGroup>
            )}
          </Controller>
          <Button type="submit">Save preferences</Button>
        </form>
      );
    };
    const { container } = renderUI(<Preferences />);
    expect(screen.getByText('*')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Save preferences' }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Pick at least one channel')).toBeInTheDocument();
    expect(group()).toHaveAccessibleDescription(
      'Pick at least one channel Schedule changes and your check-in code',
    );
    // The failed submit focuses the group, which reads its name and message;
    // Tab then goes to the boxes.
    expect(group()).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.tab();
    expect(checkbox('Email')).toHaveFocus();
    await userEvent.keyboard('[Space]');
    await userEvent.click(checkbox('Text message'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Save preferences' }),
    );
    expect(onSubmit).toHaveBeenCalledWith(
      { channels: ['email', 'sms'] },
      expect.anything(),
    );
  });

  it('through Controller, the form’s default value checks its boxes', async () => {
    const Form = () => {
      const { control } = useForm<{ channels: string[] }>({
        defaultValues: { channels: ['sms'] },
      });
      return (
        <Controller name="channels" control={control}>
          {({ field }) => (
            <CheckboxGroup label="Send ticket updates by" {...field}>
              <Checkbox value="email">Email</Checkbox>
              <Checkbox value="sms">Text message</Checkbox>
            </CheckboxGroup>
          )}
        </Controller>
      );
    };
    const { container } = renderUI(<Form />);
    expect(checkbox('Text message')).toHaveAttribute('aria-checked', 'true');
    expect(checkbox('Email')).toHaveAttribute('aria-checked', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Compile-time checks: `tsc` fails if a line under @ts-expect-error compiles.
describe('types', () => {
  it('a box on its own is controlled, and every box needs a name', () => {
    const onCheckedChange = () => undefined;
    const elements = [
      <Checkbox checked onCheckedChange={onCheckedChange}>
        Agree
      </Checkbox>,
      <Checkbox
        aria-label="Select row 1"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
      // @ts-expect-error A standalone box needs onCheckedChange with checked.
      <Checkbox checked>Agree</Checkbox>,
      // @ts-expect-error In a group the value decides; onCheckedChange is the group's.
      <Checkbox value="email" onCheckedChange={onCheckedChange}>
        Email
      </Checkbox>,
      // @ts-expect-error A box needs a name: children, aria-label or aria-labelledby.
      <Checkbox checked onCheckedChange={onCheckedChange} />,
      // @ts-expect-error aria-checked is set by the component, from checked.
      <Checkbox checked onCheckedChange={onCheckedChange} aria-checked>
        Agree
      </Checkbox>,
      // @ts-expect-error Disabled silently or with a reason, not both.
      <Checkbox
        checked
        onCheckedChange={onCheckedChange}
        disabled
        disabledWithReason="Full"
      >
        Agree
      </Checkbox>,
      // @ts-expect-error Read-only silently or with a reason, not both.
      <Checkbox
        checked
        onCheckedChange={onCheckedChange}
        readOnly
        readOnlyWithReason="Set"
      >
        Agree
      </Checkbox>,
      // @ts-expect-error A group's value is the checked boxes' values, an array.
      <CheckboxGroup label="Channels" value="email" onChange={() => undefined}>
        <Checkbox value="email">Email</Checkbox>
      </CheckboxGroup>,
      // @ts-expect-error A group needs a name: label, aria-label or aria-labelledby.
      <CheckboxGroup value={[]} onChange={() => undefined}>
        <Checkbox value="email">Email</Checkbox>
      </CheckboxGroup>,
    ];
    expect(elements).toHaveLength(10);
  });
});
