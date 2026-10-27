import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../Button';
import { Controller } from '../Form';
import { axe, renderUI } from '../test-utils';

import { radioRecipe } from './Radio.recipes.css';

import { Radio, RadioGroup } from '.';

import type { DisabledState, ReadOnlyState } from '../utils';

const { variants } = radioRecipe.classNames;

const radio = (name: string | RegExp) => screen.getByRole('radio', { name });
const radioGroup = (name: string | RegExp) =>
  screen.getByRole('radiogroup', { name });

const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

/** The recipe's ticket choice: three radios, one of them sold out. */
const Tickets = ({
  initial = '',
  onChange,
  ...props
}: {
  initial?: string;
  onChange?: (value: string) => void;
} & Omit<
  React.ComponentProps<typeof RadioGroup>,
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
  const change = (next: string) => {
    setValue(next);
    onChange?.(next);
  };
  return (
    <RadioGroup label="Ticket" {...props} value={value} onChange={change}>
      <Radio value="general">General admission</Radio>
      <Radio value="vip">VIP</Radio>
      <Radio value="student" disabledWithReason="Sold out">
        Student
      </Radio>
      <Radio value="press">Press</Radio>
    </RadioGroup>
  );
};

describe('RadioGroup', () => {
  it('is a radiogroup named by its label; each radio is named by its own', async () => {
    const { container } = renderUI(<Tickets initial="vip" />);
    expect(radio('General admission')).toHaveAttribute('aria-checked', 'false');
    expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('VIP').closest('label')).toHaveAttribute(
      'for',
      radio('VIP').id,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('chooses on a click on the radio and on its label, and only one stays chosen', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(<Tickets onChange={onChange} />);

    await userEvent.click(radio('VIP'));
    expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
    expect(onChange).toHaveBeenLastCalledWith('vip');

    await userEvent.click(screen.getByText('General admission'));
    expect(radio('General admission')).toHaveAttribute('aria-checked', 'true');
    expect(radio('VIP')).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenLastCalledWith('general');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies size and variant, defaulting to sm and default', () => {
    renderUI(
      <RadioGroup label="Badge pickup" value="desk" onChange={jest.fn()}>
        <Radio value="desk">Front desk</Radio>
        <Radio value="mail" size="md" variant="base">
          By mail
        </Radio>
      </RadioGroup>,
    );
    expect(radio('Front desk')).toHaveClass(
      variants.size.sm,
      variants.variant.default,
    );
    expect(radio('By mail')).toHaveClass(
      variants.size.md,
      variants.variant.base,
    );
  });

  it('takes its name from a heading through aria-labelledby, or from aria-label', async () => {
    const { container } = renderUI(
      <>
        <h3 id="session-length">Session length</h3>
        <RadioGroup
          aria-labelledby="session-length"
          value="30"
          onChange={jest.fn()}
        >
          <Radio value="30">30 minutes</Radio>
          <Radio value="60">60 minutes</Radio>
        </RadioGroup>
        <RadioGroup aria-label="Badge pickup" value="" onChange={jest.fn()}>
          <Radio value="desk">Front desk</Radio>
        </RadioGroup>
      </>,
    );
    expect(radioGroup('Session length')).toBeInTheDocument();
    expect(radioGroup('Badge pickup')).toBeInTheDocument();
    expect(radio('30 minutes')).toHaveAttribute('aria-checked', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('help text describes the group; required marks the label and sets aria-required', async () => {
    const { container } = renderUI(
      <Tickets
        required
        helpText="You can change it until the day before."
        error="Choose a ticket"
      />,
    );
    const group = radioGroup('Ticket');
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Choose a ticket')).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription(
      'Choose a ticket You can change it until the day before.',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a press on the group label focuses the chosen radio, else the first', async () => {
    const { rerender } = renderUI(<Tickets initial="vip" />);
    await userEvent.click(screen.getByText('Ticket'));
    expect(radio('VIP')).toHaveFocus();

    rerender(<Tickets key="none-chosen" initial="" />);
    await userEvent.click(screen.getByText('Ticket'));
    expect(radio('General admission')).toHaveFocus();
  });

  it('runs onBlur only once focus leaves the group', async () => {
    const onBlur = jest.fn();
    renderUI(
      <>
        <Tickets onBlur={onBlur} />
        <button>After</button>
      </>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(radio('VIP')).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  describe('keyboard', () => {
    it('is one tab stop: Tab lands on the chosen radio, else the first, and Tab again leaves', async () => {
      const { container, rerender } = renderUI(
        <>
          <Tickets />
          <button>After</button>
        </>,
      );
      await userEvent.tab();
      expect(radio('General admission')).toHaveFocus();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();

      rerender(
        <>
          <Tickets key="vip-chosen" initial="vip" />
          <button>After</button>
        </>,
      );
      await userEvent.tab({ shift: true });
      expect(radio('VIP')).toHaveFocus();
      // The radios outside the tab stop stay at tabindex -1.
      expect(radio('General admission')).toHaveAttribute('tabindex', '-1');
      expect(radio('Press')).toHaveAttribute('tabindex', '-1');
    });

    it('after choosing with the keyboard, Tab leaves and Shift+Tab returns to the chosen radio', async () => {
      renderUI(
        <>
          <Tickets />
          <button>After</button>
        </>,
      );
      await userEvent.tab();
      await userEvent.keyboard('{ArrowDown}[Space]');
      expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.tab({ shift: true });
      expect(radio('VIP')).toHaveFocus();
    });

    it('the arrow keys move between the radios, wrapping; Home and End go to the ends', async () => {
      renderUI(<Tickets initial="general" />);
      await userEvent.tab();
      expect(radio('General admission')).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      expect(radio('VIP')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(radio('Student')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(radio('Press')).toHaveFocus();
      // Past the last wraps to the first, and back.
      await userEvent.keyboard('{ArrowDown}');
      expect(radio('General admission')).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      expect(radio('Press')).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(radio('Student')).toHaveFocus();

      await userEvent.keyboard('{Home}');
      expect(radio('General admission')).toHaveFocus();
      await userEvent.keyboard('{End}');
      expect(radio('Press')).toHaveFocus();
    });

    it('Space chooses the focused radio; Enter does not', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(<Tickets onChange={onChange} />);
      await userEvent.tab();
      await userEvent.keyboard('{ArrowDown}');
      expect(radio('VIP')).toHaveFocus();
      // Enter submits a form; it never chooses a radio.
      await userEvent.keyboard('{Enter}');
      expect(onChange).not.toHaveBeenCalledWith('vip');
      expect(radio('VIP')).toHaveAttribute('aria-checked', 'false');

      await userEvent.keyboard('[Space]');
      expect(onChange).toHaveBeenCalledWith('vip');
      expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
      expect(radio('VIP')).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('when a radio or the group cannot be chosen', () => {
    it('a radio disabled with a reason stays reachable by the arrow keys, so the reason is read — but cannot be chosen', async () => {
      const onChange = jest.fn();
      renderUI(<Tickets initial="vip" onChange={onChange} />);
      const student = radio('Student');
      expect(student).toHaveAttribute('aria-disabled', 'true');
      expect(student).toHaveAccessibleDescription('Sold out');

      await userEvent.tab();
      expect(radio('VIP')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(student).toHaveFocus();
      await userEvent.hover(student);
      expect(await tooltipEntries()).toEqual(['Sold out']);
      expect(await axe(document.body)).toHaveNoViolations();

      await userEvent.keyboard('[Space]');
      await userEvent.click(student);
      await userEvent.click(screen.getByText('Student'));
      expect(onChange).not.toHaveBeenCalledWith('student');
      expect(student).toHaveAttribute('aria-checked', 'false');
      expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
    });

    it('a silently disabled radio is skipped by the arrow keys and cannot be chosen', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <RadioGroup label="Ticket" value="general" onChange={onChange}>
          <Radio value="general">General admission</Radio>
          <Radio value="staff" disabled>
            Staff
          </Radio>
          <Radio value="press">Press</Radio>
        </RadioGroup>,
      );
      expect(radio('Staff')).toHaveAttribute('aria-disabled', 'true');
      await userEvent.tab();
      expect(radio('General admission')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(radio('Press')).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      expect(radio('General admission')).toHaveFocus();

      await userEvent.click(radio('Staff'));
      await userEvent.click(screen.getByText('Staff'));
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a silently disabled group leaves the tab order altogether', async () => {
      const onChange = jest.fn();
      const { container } = renderUI(
        <>
          <Tickets initial="general" disabled onChange={onChange} />
          <button>After</button>
        </>,
      );
      expect(radioGroup('Ticket')).toHaveAttribute('tabindex', '-1');
      for (const name of ['General admission', 'VIP', 'Press']) {
        expect(radio(name)).toHaveAttribute('aria-disabled', 'true');
        expect(radio(name)).toHaveAttribute('tabindex', '-1');
      }
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.click(radio('VIP'));
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a group disabled with a reason: the radios stay reachable, each shows it, its own reason wins', async () => {
      const onChange = jest.fn();
      renderUI(
        <RadioGroup
          label="Meal"
          value=""
          onChange={onChange}
          disabledWithReason="Meals open a week before the event"
        >
          <Radio value="standard">Standard</Radio>
          <Radio value="vegetarian" disabledWithReason="Kitchen is closed">
            Vegetarian
          </Radio>
        </RadioGroup>,
      );
      const group = radioGroup('Meal');
      expect(group).toHaveAttribute('aria-disabled', 'true');
      expect(group).toHaveAccessibleDescription(
        'Meals open a week before the event',
      );
      expect(radio('Standard')).toHaveAccessibleDescription(
        'Meals open a week before the event',
      );
      expect(radio('Vegetarian')).toHaveAccessibleDescription(
        'Kitchen is closed',
      );

      await userEvent.tab();
      expect(radio('Standard')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(radio('Vegetarian')).toHaveFocus();
      await userEvent.keyboard('[Space]');
      await userEvent.click(radio('Standard'));
      expect(onChange).not.toHaveBeenCalled();
      expect(await axe(document.body)).toHaveNoViolations();
    });

    it('a read-only group says so itself; its radios can be read but not changed', async () => {
      const onChange = jest.fn();
      const { container, rerender } = renderUI(
        <RadioGroup
          label="Seating"
          value="assigned"
          onChange={onChange}
          readOnlyWithReason="Seats are assigned by the organizer"
        >
          <Radio value="assigned">Assigned seat</Radio>
          <Radio value="open">Open seating</Radio>
        </RadioGroup>,
      );
      const group = radioGroup('Seating');
      expect(group).toHaveAttribute('aria-readonly', 'true');
      expect(group).not.toHaveAttribute('aria-disabled');
      expect(group).toHaveAccessibleDescription(
        'Seats are assigned by the organizer',
      );
      expect(radio('Assigned seat')).toHaveAttribute('aria-checked', 'true');
      expect(radio('Open seating')).not.toHaveAttribute('aria-disabled');

      await userEvent.tab();
      expect(radio('Assigned seat')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(radio('Open seating')).toHaveFocus();
      await userEvent.keyboard('[Space]');
      await userEvent.click(radio('Open seating'));
      await userEvent.click(screen.getByText('Open seating'));
      expect(onChange).not.toHaveBeenCalled();
      expect(radio('Assigned seat')).toHaveAttribute('aria-checked', 'true');
      expect(await axe(container)).toHaveNoViolations();

      rerender(
        <>
          <RadioGroup
            label="Seating"
            value="assigned"
            onChange={onChange}
            readOnly
          >
            <Radio value="assigned">Assigned seat</Radio>
            <Radio value="open">Open seating</Radio>
          </RadioGroup>
          <button>After</button>
        </>,
      );
      expect(radioGroup('Seating')).toHaveAttribute('aria-readonly', 'true');
      expect(radioGroup('Seating')).toHaveAttribute('tabindex', '-1');
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await userEvent.click(radio('Open seating'));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('a radio’s hint describes it, from the info button after its label', async () => {
    renderUI(
      <RadioGroup label="Ticket" value="" onChange={jest.fn()}>
        <Radio value="general">General admission</Radio>
        <Radio value="vip" hint="Includes the speaker dinner">
          VIP
        </Radio>
      </RadioGroup>,
    );
    expect(radio('VIP')).toHaveAccessibleDescription(
      'Includes the speaker dinner',
    );
    const hint = screen.getByRole('button', { name: 'About VIP' });
    await userEvent.hover(hint);
    expect(await tooltipEntries()).toEqual(['Includes the speaker dinner']);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a radio’s tooltip describes it and shows on hover', async () => {
    renderUI(
      <RadioGroup label="Session length" value="30" onChange={jest.fn()}>
        <Radio value="30">30 minutes</Radio>
        <Radio value="60" tooltip="Needs a room with a projector">
          60 minutes
        </Radio>
      </RadioGroup>,
    );
    const long = radio('60 minutes');
    expect(long).toHaveAccessibleDescription('Needs a room with a projector');
    await userEvent.hover(long);
    expect(await tooltipEntries()).toEqual(['Needs a room with a projector']);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a Radio outside a RadioGroup is an error', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    expect(() => renderUI(<Radio value="vip">VIP</Radio>)).toThrow(
      'Radio: render it inside a RadioGroup',
    );
    consoleError.mockRestore();
  });

  it('in a form through Controller: required and error from its rules, focus on a failed submit', async () => {
    const onSubmit = jest.fn();
    const TicketForm = () => {
      const { control, handleSubmit } = useForm<{ ticket: string }>({
        defaultValues: { ticket: '' },
      });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="ticket"
            control={control}
            rules={{ required: 'Choose a ticket' }}
          >
            {({ field }) => (
              <RadioGroup
                label="Ticket"
                helpText="You can change it until the day before."
                {...field}
              >
                <Radio value="general">General admission</Radio>
                <Radio value="vip">VIP</Radio>
                <Radio value="student" disabledWithReason="Sold out">
                  Student
                </Radio>
              </RadioGroup>
            )}
          </Controller>
          <Button type="submit">Register</Button>
        </form>
      );
    };
    const { container } = renderUI(<TicketForm />);
    const group = radioGroup('Ticket');
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-required', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Choose a ticket')).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription(
      'Choose a ticket You can change it until the day before.',
    );
    // The failed submit focuses the group: its first radio takes focus.
    expect(radio('General admission')).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.keyboard('{ArrowDown}[Space]');
    expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(onSubmit).toHaveBeenCalledWith({ ticket: 'vip' }, expect.anything());
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('through Controller, the form’s default value chooses its radio', async () => {
    const Form = () => {
      const { control } = useForm<{ ticket: string }>({
        defaultValues: { ticket: 'vip' },
      });
      return (
        <Controller name="ticket" control={control}>
          {({ field }) => (
            <RadioGroup label="Ticket" {...field}>
              <Radio value="general">General admission</Radio>
              <Radio value="vip">VIP</Radio>
            </RadioGroup>
          )}
        </Controller>
      );
    };
    const { container } = renderUI(<Form />);
    expect(radio('VIP')).toHaveAttribute('aria-checked', 'true');
    await userEvent.tab();
    expect(radio('VIP')).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Compile-time checks: `tsc` fails if a line under @ts-expect-error compiles.
describe('types', () => {
  it('every radio needs a value and a name, and its group a name', () => {
    const onChange = () => undefined;
    const elements = [
      <RadioGroup label="Ticket" value="" onChange={onChange}>
        <Radio value="vip">VIP</Radio>
      </RadioGroup>,
      // @ts-expect-error A radio needs the value choosing it sets.
      <Radio>VIP</Radio>,
      // @ts-expect-error A radio needs a name: children, aria-label or aria-labelledby.
      <Radio value="vip" />,
      // @ts-expect-error aria-checked is set by the component, from the group's value.
      <Radio value="vip" aria-checked>
        VIP
      </Radio>,
      // @ts-expect-error Disabled silently or with a reason, not both.
      <Radio value="vip" disabled disabledWithReason="Sold out">
        VIP
      </Radio>,
      // @ts-expect-error A group needs a name: label, aria-label or aria-labelledby.
      <RadioGroup value="" onChange={onChange}>
        <Radio value="vip">VIP</Radio>
      </RadioGroup>,
      // @ts-expect-error The group is controlled: onChange goes with value.
      <RadioGroup label="Ticket" value="">
        <Radio value="vip">VIP</Radio>
      </RadioGroup>,
    ];
    expect(elements).toHaveLength(7);
  });
});
