import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { axe, renderUI } from '../test-utils';

import { switchRecipe } from './Switch.recipes.css';

import { Switch, type SwitchProps } from '.';

import type { DisabledState, ReadOnlyState } from '../utils';

const { variants } = switchRecipe.classNames;

const switchControl = (name: string | RegExp) =>
  screen.getByRole('switch', { name });

const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

/** One controlled switch, as the recipe's settings. */
const OneSwitch = ({
  initial = false,
  ...props
}: {
  initial?: boolean;
} & Pick<SwitchProps, 'size' | 'variant' | 'hint' | 'tooltip'> &
  DisabledState &
  ReadOnlyState &
  ({ children: string } | { 'aria-label': string })) => {
  const [checked, setChecked] = useState(initial);
  return <Switch {...props} checked={checked} onCheckedChange={setChecked} />;
};

describe('Switch', () => {
  it('is a switch named by its label, reporting whether it is on', async () => {
    const { container } = renderUI(
      <>
        <OneSwitch>Email reminders</OneSwitch>
        <OneSwitch initial>Public profile</OneSwitch>
      </>,
    );
    const reminders = switchControl('Email reminders');
    expect(reminders).toHaveAttribute('aria-checked', 'false');
    expect(reminders).toHaveAttribute('tabindex', '0');
    expect(switchControl('Public profile')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(
      screen.getByText('Email reminders').closest('label'),
    ).toHaveAttribute('for', reminders.id);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('flips on a click on the track, on its label, on Space and on Enter', async () => {
    const onCheckedChange = jest.fn();
    const Tracked = () => {
      const [checked, setChecked] = useState(false);
      return (
        <Switch
          checked={checked}
          onCheckedChange={(next) => {
            onCheckedChange(next);
            setChecked(next);
          }}
        >
          Reminders
        </Switch>
      );
    };
    const { container } = renderUI(<Tracked />);
    const control = switchControl('Reminders');

    await userEvent.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByText('Reminders'));
    expect(control).toHaveAttribute('aria-checked', 'false');

    await userEvent.tab();
    expect(control).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(control).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(control).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange.mock.calls).toEqual([
      [true],
      [false],
      [true],
      [false],
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is in the tab order between its neighbours, both ways', async () => {
    renderUI(
      <>
        <button>Before</button>
        <OneSwitch>Reminders</OneSwitch>
        <button>After</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    await userEvent.tab();
    expect(switchControl('Reminders')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(switchControl('Reminders')).toHaveFocus();
  });

  it('applies size and variant, defaulting to sm and default', () => {
    renderUI(
      <>
        <OneSwitch>Plain</OneSwitch>
        <OneSwitch size="md" variant="base">
          Large base
        </OneSwitch>
      </>,
    );
    expect(switchControl('Plain')).toHaveClass(
      variants.size.sm,
      variants.variant.default,
    );
    expect(switchControl('Large base')).toHaveClass(
      variants.size.md,
      variants.variant.base,
    );
  });

  it('takes its name from aria-label or aria-labelledby instead of a label', async () => {
    const { container } = renderUI(
      <>
        <OneSwitch aria-label="Dark preview" />
        <span id="session-title">Opening keynote</span>
        <Switch
          aria-labelledby="session-title"
          checked={false}
          onCheckedChange={() => undefined}
        />
      </>,
    );
    expect(switchControl('Dark preview')).toBeInTheDocument();
    expect(switchControl('Opening keynote')).toBeInTheDocument();
    expect(container.querySelector('label')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the hint describes the switch, and its info button is the next tab stop', async () => {
    renderUI(
      <OneSwitch hint="A day before each session you saved">
        Reminders
      </OneSwitch>,
    );
    const control = switchControl('Reminders');
    expect(control).toHaveAccessibleDescription(
      'A day before each session you saved',
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(
      screen.getByRole('button', { name: 'About Reminders' }),
    ).toHaveFocus();
  });

  it('the tooltip describes the switch and shows on hover, above any reason', async () => {
    renderUI(
      <OneSwitch
        tooltip="Sent to the address on your ticket"
        disabledWithReason="Admins only"
      >
        Reminders
      </OneSwitch>,
    );
    const control = switchControl('Reminders');
    expect(control).toHaveAccessibleDescription(
      'Sent to the address on your ticket Admins only',
    );
    await userEvent.hover(control);
    expect(await tooltipEntries()).toEqual([
      'Sent to the address on your ticket',
      'Admins only',
    ]);
  });

  describe('when it cannot be flipped', () => {
    it('disabled silently: out of the tab order, and no press flips it', async () => {
      const onCheckedChange = jest.fn();
      const { container } = renderUI(
        <>
          <Switch checked={false} onCheckedChange={onCheckedChange} disabled>
            Allow refunds
          </Switch>
          <OneSwitch>Reminders</OneSwitch>
        </>,
      );
      const control = switchControl('Allow refunds');
      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(control).toHaveAttribute('tabindex', '-1');
      expect(control).not.toHaveAttribute('disabled');

      await userEvent.tab();
      expect(switchControl('Reminders')).toHaveFocus();

      await userEvent.click(control);
      await userEvent.click(screen.getByText('Allow refunds'));
      control.focus();
      await userEvent.keyboard('[Space]{Enter}');
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(control).toHaveAttribute('aria-checked', 'false');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('disabled with a reason: it keeps its tab stop, and the switch and its label show why', async () => {
      const onCheckedChange = jest.fn();
      renderUI(
        <>
          <Switch
            checked={false}
            onCheckedChange={onCheckedChange}
            disabledWithReason="Refunds close when the event starts"
          >
            Allow refunds
          </Switch>
          <OneSwitch>Reminders</OneSwitch>
        </>,
      );
      const control = switchControl('Allow refunds');
      expect(control).toHaveAttribute('aria-disabled', 'true');
      expect(control).toHaveAttribute('tabindex', '0');
      expect(control).toHaveAccessibleDescription(
        'Refunds close when the event starts',
      );

      await userEvent.tab();
      expect(control).toHaveFocus();
      await userEvent.hover(control);
      expect(await tooltipEntries()).toEqual([
        'Refunds close when the event starts',
      ]);
      expect(await axe(document.body)).toHaveNoViolations();
      await userEvent.unhover(control);

      await userEvent.hover(screen.getByText('Allow refunds'));
      expect(await tooltipEntries()).toEqual([
        'Refunds close when the event starts',
      ]);

      await userEvent.keyboard('[Space]{Enter}');
      await userEvent.click(control);
      await userEvent.click(screen.getByText('Allow refunds'));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('read-only silently: aria-readonly, not disabled, and no press flips it', async () => {
      const onCheckedChange = jest.fn();
      const { container } = renderUI(
        <Switch checked onCheckedChange={onCheckedChange} readOnly>
          Badge photo
        </Switch>,
      );
      const control = switchControl('Badge photo');
      expect(control).toHaveAttribute('aria-readonly', 'true');
      expect(control).not.toHaveAttribute('aria-disabled');
      expect(control).toHaveAttribute('tabindex', '-1');
      await userEvent.click(control);
      await userEvent.click(screen.getByText('Badge photo'));
      control.focus();
      await userEvent.keyboard('[Space]');
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(control).toHaveAttribute('aria-checked', 'true');
      expect(await axe(container)).toHaveNoViolations();
    });

    it('read-only with a reason: it keeps its tab stop, and the switch and its label show why', async () => {
      const onCheckedChange = jest.fn();
      renderUI(
        <Switch
          checked
          onCheckedChange={onCheckedChange}
          readOnlyWithReason="Set by your organization"
        >
          Badge photo
        </Switch>,
      );
      const control = switchControl('Badge photo');
      expect(control).toHaveAttribute('aria-readonly', 'true');
      expect(control).toHaveAttribute('tabindex', '0');
      expect(control).toHaveAccessibleDescription('Set by your organization');

      await userEvent.hover(screen.getByText('Badge photo'));
      expect(await tooltipEntries()).toEqual(['Set by your organization']);

      await userEvent.click(control);
      await userEvent.keyboard('[Space]');
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(await axe(document.body)).toHaveNoViolations();
    });
  });
});

describe('types', () => {
  it('a switch is controlled, and every switch needs a name', () => {
    const onCheckedChange = () => undefined;
    const elements = [
      <Switch checked onCheckedChange={onCheckedChange}>
        Reminders
      </Switch>,
      <Switch
        aria-label="Dark preview"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
      // @ts-expect-error A switch needs onCheckedChange with checked.
      <Switch checked>Reminders</Switch>,
      // @ts-expect-error A switch needs a name: children, aria-label or aria-labelledby.
      <Switch checked onCheckedChange={onCheckedChange} />,
      // @ts-expect-error aria-checked is set by the component, from checked.
      <Switch checked onCheckedChange={onCheckedChange} aria-checked>
        Reminders
      </Switch>,
      // @ts-expect-error Disabled silently or with a reason, not both.
      <Switch
        checked
        onCheckedChange={onCheckedChange}
        disabled
        disabledWithReason="Admins only"
      >
        Reminders
      </Switch>,
      // @ts-expect-error A switch takes effect at once: it submits nothing.
      <Switch checked onCheckedChange={onCheckedChange} name="reminders">
        Reminders
      </Switch>,
    ];
    expect(elements).toHaveLength(7);
  });
});
