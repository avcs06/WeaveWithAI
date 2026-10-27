import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtSign } from 'lucide-react';
import React, { createRef } from 'react';

import { axe, renderUI } from '../test-utils';

import { ControlBox, controlAttributes } from './auxiliary';
import { ControlChoice } from './ControlChoice';
import { FormControl } from './FormControl';
import { formControlRecipe } from './FormControl.recipes.css';

import type { FormControlOwnProps } from './FormControl.types';

const { variants } = formControlRecipe.classNames;

/** A FormControl around a native input, as Input renders it. */
const Field = (props: FormControlOwnProps) => (
  <FormControl {...props}>
    {({ isDisabled, ...controlProps }) => (
      <input {...controlProps} readOnly={isDisabled} />
    )}
  </FormControl>
);

const textbox = (name = 'Email') => screen.getByRole('textbox', { name });
const box = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="box"]')!;
const message = (container: HTMLElement) =>
  container.querySelector('[data-slot="message"]')!;

describe('FormControl', () => {
  it('labels the control: the label names it, and its id is the label’s htmlFor', async () => {
    const { container } = renderUI(<Field label="Email" />);
    const input = textbox();
    expect(screen.getByText('Email').closest('label')).toHaveAttribute(
      'for',
      input.id,
    );
    expect(input).toHaveAttribute('data-slot', 'control');
    expect(input).toHaveAttribute('tabindex', '0');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('names the control: name, else the label, the placeholder, then the id', () => {
    const { rerender } = renderUI(
      <Field id="email" name="contact" label="Email" />,
    );
    expect(textbox()).toHaveAttribute('name', 'contact');
    rerender(<Field id="email" label="Email" placeholder="you@example.com" />);
    expect(textbox()).toHaveAttribute('name', 'Email');
    rerender(<Field id="email" placeholder="you@example.com" />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'name',
      'you@example.com',
    );
    rerender(<Field id="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
  });

  it('aria-labelledby names a control with no label, from a heading', async () => {
    const { container } = renderUI(
      <>
        <h3 id="doors">Doors open</h3>
        <Field aria-labelledby="doors" />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Doors open' })).toHaveAttribute(
      'aria-labelledby',
      'doors',
    );
    expect(container.querySelector('label')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('required: the mark after the label, aria-required, no native validation', async () => {
    const { container } = renderUI(<Field label="Email" required />);
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(textbox()).toHaveAttribute('aria-required', 'true');
    expect(textbox()).not.toHaveAttribute('required');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the hint: an info button after the label, a tab stop before the control, read as its description', async () => {
    const { container } = renderUI(
      <Field label="Email" hint="Where receipts go" />,
    );
    const hint = screen.getByRole('button', { name: 'About Email' });
    expect(hint).toHaveAccessibleDescription('Where receipts go');
    expect(textbox()).toHaveAccessibleDescription('Where receipts go');
    await userEvent.tab();
    expect(hint).toHaveFocus();
    await userEvent.tab();
    expect(textbox()).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(hint).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('labelRightSlot sits at the end of the label’s row', () => {
    const { container } = renderUI(
      <Field label="Email" labelRightSlot={<a href="#help">Help</a>} />,
    );
    const row = container.querySelector('[data-slot="label-row"]')!;
    expect(row.lastElementChild).toHaveTextContent('Help');
  });

  it('help text describes the control', async () => {
    const { container } = renderUI(
      <Field label="Email" helpText="For receipts" />,
    );
    expect(textbox()).toHaveAccessibleDescription('For receipts');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('descriptions read in order: the message, the help text, the hint, the tooltip, the reason', async () => {
    const { container } = renderUI(
      <Field
        label="Email"
        error="Enter your email"
        helpText="For receipts"
        hint="Where receipts go"
        tooltip="We never share it"
        disabledWithReason="Verified emails can't change"
      />,
    );
    expect(textbox()).toHaveAccessibleDescription(
      "Enter your email For receipts Where receipts go We never share it Verified emails can't change",
    );
    expect(textbox()).toBeInvalid();
    expect(textbox()).toHaveAttribute('aria-disabled', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  describe('status', () => {
    it('error wins over warning and success: only its style and message show', async () => {
      const { container } = renderUI(
        <Field
          label="Email"
          error="Enter your email"
          warning="Unusual"
          success="Fine"
        />,
      );
      expect(box(container)).toHaveAttribute('data-status', 'error');
      expect(message(container)).toHaveTextContent(/^Enter your email$/);
      expect(textbox()).toBeInvalid();
      expect(textbox()).toHaveAccessibleDescription('Enter your email');
      // The description is the status message itself, by id.
      expect(textbox()).toHaveAttribute(
        'aria-describedby',
        message(container).id,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('warning wins over success; true styles without a message', () => {
      const { container, rerender } = renderUI(
        <Field label="Email" warning success="Fine" />,
      );
      expect(box(container)).toHaveAttribute('data-status', 'warning');
      expect(message(container)).toBeEmptyDOMElement();
      expect(textbox()).toBeValid();
      rerender(<Field label="Email" success="Looks good" />);
      expect(box(container)).toHaveAttribute('data-status', 'success');
      expect(message(container)).toHaveTextContent('Looks good');
      expect(textbox()).toBeValid();
      expect(textbox()).toHaveAccessibleDescription('Looks good');
    });

    it('error={true} is invalid with no message to announce', async () => {
      const { container } = renderUI(<Field label="Email" error />);
      expect(box(container)).toHaveAttribute('data-status', 'error');
      expect(message(container)).toBeEmptyDOMElement();
      expect(textbox()).toBeInvalid();
      expect(textbox()).not.toHaveAttribute('aria-describedby');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('a message that appears later lands in a live region that was there from the start', () => {
      const { container, rerender } = renderUI(<Field label="Email" />);
      const region = message(container);
      expect(region).toHaveAttribute('role', 'status');
      expect(region).toBeEmptyDOMElement();
      rerender(<Field label="Email" warning="This domain bounces often" />);
      expect(message(container)).toBe(region);
      expect(region).toHaveTextContent('This domain bounces often');
    });
  });

  describe('box', () => {
    it('takes size, variant and look', () => {
      const { container } = renderUI(
        <Field label="Email" size="md" variant="base" look="open" />,
      );
      expect(box(container)).toHaveClass(
        variants.size.md,
        variants.variant.base,
        variants.border.open,
      );
    });

    it('defaults to sm, default and outline', () => {
      const { container } = renderUI(<Field label="Email" />);
      expect(box(container)).toHaveClass(
        variants.size.sm,
        variants.variant.default,
        variants.border.outline,
      );
    });

    it('puts icons and add-ons around the control; loading shows the spinner', async () => {
      const { container, rerender } = renderUI(
        <Field
          label="Email"
          leftIcon={<AtSign data-testid="icon" />}
          rightAddOn={<span>.com</span>}
        />,
      );
      const parts = Array.from(box(container).children);
      expect(parts[0]).toContainElement(screen.getByTestId('icon'));
      expect(parts[1]).toBe(textbox());
      expect(parts[2]).toHaveAttribute('data-slot', 'add-on');
      expect(box(container)).toHaveAttribute('data-left');
      expect(await axe(container)).toHaveNoViolations();

      rerender(
        <Field
          label="Email"
          leftIcon={<AtSign data-testid="icon" />}
          loading
        />,
      );
      expect(screen.queryByTestId('icon')).toBeNull();
      expect(
        box(container).querySelector('.lucide-loader-circle'),
      ).not.toBeNull();
      expect(textbox()).toHaveAttribute('aria-busy', 'true');
    });

    it('a press anywhere on it focuses the control', async () => {
      const { container } = renderUI(
        <Field label="Email" leftIcon={<AtSign data-testid="icon" />} />,
      );
      await userEvent.click(screen.getByTestId('icon'));
      expect(textbox()).toHaveFocus();
      expect(box(container)).toBeInTheDocument();
    });

    it('the tooltip and the disabled reason describe the control, the tooltip first', async () => {
      const { container } = renderUI(
        <Field
          label="Email"
          tooltip="We never share it"
          disabledWithReason="Verified emails can't change"
        />,
      );
      expect(textbox()).toHaveAccessibleDescription(
        "We never share it Verified emails can't change",
      );
      expect(textbox()).toHaveAttribute('aria-disabled', 'true');
      // The reason must be reachable, so the control keeps its tab stop.
      await userEvent.tab();
      expect(textbox()).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('keeps the focused control when a reason comes and goes', () => {
      const { rerender } = renderUI(<Field label="Email" />);
      const input = textbox();
      input.focus();
      rerender(
        <Field
          label="Email"
          loadingWithReason="Checking"
          disableWhileLoading={false}
        />,
      );
      expect(textbox()).toBe(input);
      expect(input).toHaveFocus();
    });
  });

  describe('when disabled', () => {
    it.each([
      ['disabled', { disabled: true }],
      ['loading', { loading: true }],
    ] as const)(
      '%s, silently: the control is out of the tab order, its label doesn’t focus it',
      async (_, state) => {
        const { container } = renderUI(<Field label="Email" {...state} />);
        expect(textbox()).toHaveAttribute('aria-disabled', 'true');
        expect(textbox()).toHaveAttribute('tabindex', '-1');
        expect(box(container)).toHaveAttribute('data-disabled');
        await userEvent.tab();
        expect(textbox()).not.toHaveFocus();
        await userEvent.click(screen.getByText('Email'));
        expect(textbox()).not.toHaveFocus();
        expect(await axe(container)).toHaveNoViolations();
      },
    );

    it('loading, silently: busy as well as disabled', () => {
      renderUI(<Field label="Email" loading />);
      expect(textbox()).toHaveAttribute('aria-busy', 'true');
      expect(textbox()).toHaveAttribute('aria-disabled', 'true');
      expect(textbox()).not.toHaveAttribute('aria-readonly');
    });

    it('readOnly: the value stays focusable and readable, its label focuses it', async () => {
      const { container } = renderUI(<Field label="Email" readOnly />);
      expect(textbox()).toHaveAttribute('aria-readonly', 'true');
      expect(textbox()).not.toHaveAttribute('aria-disabled');
      expect(textbox()).toHaveAttribute('tabindex', '0');
      expect(box(container)).toHaveAttribute('data-disabled');
      await userEvent.tab();
      expect(textbox()).toHaveFocus();
      await userEvent.click(screen.getByText('Email'));
      expect(textbox()).toHaveFocus();
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each([
      [
        'disabledWithReason',
        { disabledWithReason: "Verified emails can't change" },
        "Verified emails can't change",
      ],
      [
        'readOnlyWithReason',
        { readOnlyWithReason: 'The link is generated for you' },
        'The link is generated for you',
      ],
      [
        'loadingWithReason',
        { loadingWithReason: 'Checking the address' },
        'Checking the address',
      ],
    ] as const)(
      '%s: the control keeps its tab stop so the reason is reachable, and the reason describes it',
      async (_, state, reason) => {
        const { container } = renderUI(<Field label="Email" {...state} />);
        expect(textbox()).toHaveAttribute('tabindex', '0');
        expect(textbox()).toHaveAccessibleDescription(reason);
        await userEvent.tab();
        expect(textbox()).toHaveFocus();
        await userEvent.click(screen.getByText('Email'));
        expect(textbox()).toHaveFocus();
        expect(await axe(container)).toHaveNoViolations();
      },
    );

    it('disabledWithReason and loadingWithReason are aria-disabled; readOnlyWithReason is aria-readonly', () => {
      const { rerender } = renderUI(
        <Field label="Email" disabledWithReason="Locked" />,
      );
      expect(textbox()).toHaveAttribute('aria-disabled', 'true');
      expect(textbox()).not.toHaveAttribute('aria-readonly');
      rerender(<Field label="Email" loadingWithReason="Checking" />);
      expect(textbox()).toHaveAttribute('aria-disabled', 'true');
      expect(textbox()).toHaveAttribute('aria-busy', 'true');
      rerender(<Field label="Email" readOnlyWithReason="Generated" />);
      expect(textbox()).toHaveAttribute('aria-readonly', 'true');
      expect(textbox()).not.toHaveAttribute('aria-disabled');
    });

    it('loading with disableWhileLoading={false} stays enabled', async () => {
      renderUI(<Field label="Email" loading disableWhileLoading={false} />);
      expect(textbox()).not.toHaveAttribute('aria-disabled');
      expect(textbox()).toHaveAttribute('aria-busy', 'true');
      expect(textbox()).toHaveAttribute('tabindex', '0');
      await userEvent.tab();
      expect(textbox()).toHaveFocus();
    });
  });

  it('a click on the label focuses any control, native or not', async () => {
    renderUI(
      <FormControl label="Country" withControlBox={false}>
        {(controlProps) => (
          <ControlBox {...controlProps} role="combobox" aria-expanded={false}>
            Peru
          </ControlBox>
        )}
      </FormControl>,
    );
    await userEvent.click(screen.getByText('Country'));
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveFocus();
  });

  it('Tab reaches an enabled control, and Shift+Tab leaves it', async () => {
    renderUI(<Field label="Email" />);
    await userEvent.tab();
    expect(textbox()).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(textbox()).not.toHaveFocus();
  });

  it('passes its ref to the control', () => {
    const ref = createRef<HTMLElement>();
    renderUI(<Field label="Email" ref={ref} />);
    expect(ref.current).toBe(textbox());
  });

  it('a cut label still names the control in full', async () => {
    const rect = (width: number) => ({ width }) as DOMRect;
    Range.prototype.getBoundingClientRect = () => rect(400);
    jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => rect(100));
    const { container } = renderUI(
      <Field label="The email we send your receipts to" />,
    );
    await act(async () => undefined);
    expect(
      screen.getByRole('textbox', {
        name: 'The email we send your receipts to',
      }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    jest.restoreAllMocks();
    // @ts-expect-error jsdom has none; this test added one.
    delete Range.prototype.getBoundingClientRect;
  });
});

describe('ControlChoice', () => {
  const Choice = ({
    onPress = () => undefined,
    hint,
  }: {
    onPress?: () => void;
    hint?: string;
  }) => (
    <ControlChoice
      slot="checkbox"
      id={undefined}
      label="Email me the receipts"
      hint={hint}
      required={false}
      isDisabled={false}
      aria-labelledby={undefined}
      aria-describedby={undefined}
      className={undefined}
      style={undefined}
    >
      {(choiceBox) => (
        <button type="button" {...choiceBox} onClick={onPress}>
          ✓
        </button>
      )}
    </ControlChoice>
  );

  it('the label names the box and a press on it presses the box', async () => {
    const onPress = jest.fn();
    const { container } = renderUI(<Choice onPress={onPress} />);
    const choiceBox = screen.getByRole('button', {
      name: 'Email me the receipts',
    });
    await userEvent.click(screen.getByText('Email me the receipts'));
    expect(onPress).toHaveBeenCalledTimes(1);
    await userEvent.tab();
    expect(choiceBox).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the hint describes the box, from the info button after its label', async () => {
    const { container } = renderUI(
      <Choice hint="One email per order" />,
    );
    expect(
      screen.getByRole('button', { name: 'About Email me the receipts' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Email me the receipts' }),
    ).toHaveAccessibleDescription('One email per order');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('controlAttributes', () => {
  it("keeps the control's own attributes and the placeholder, without FormControl's props", () => {
    expect(
      controlAttributes({
        label: 'Email',
        error: 'Required',
        disabled: true,
        size: 'md',
        placeholder: 'you@example.com',
        maxLength: 40,
        autoComplete: 'email',
      }),
    ).toEqual({
      placeholder: 'you@example.com',
      maxLength: 40,
      autoComplete: 'email',
    });
  });
});
