import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../Button';
import { Controller } from '../Form';
import { axe, renderUI } from '../test-utils';

import { Card, CardGroup } from './Card';
import { cardRecipe } from './Card.recipes.css';

const { variants } = cardRecipe.classNames;

// The shown tooltip is aria-hidden: the trigger's description says the same
// thing to screen readers, so role queries need `hidden`.
const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

// Radix moves radio focus on a timer and selects the item it lands on only
// while the arrow key is still down, as it is for a person pressing it, so
// hold the key until focus arrives, then release it.
const arrowTo = async (
  user: ReturnType<typeof userEvent.setup>,
  key: string,
  element: HTMLElement,
) => {
  await user.keyboard(`{${key}>}`);
  await waitFor(() => expect(element).toHaveFocus());
  await user.keyboard(`{/${key}}`);
};

describe('Card', () => {
  it('is static without onClick: no role or tab stop of its own, its actions stay reachable', async () => {
    const { container } = renderUI(
      <Card>
        <h3>Frontend summit</h3>
        <p>120 attendees registered.</p>
        <Button size="sm">Edit event</Button>
      </Card>,
    );
    const card = screen.getByRole('heading', { name: 'Frontend summit' })
      .parentElement!;
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
    expect(
      screen.queryByRole('button', { name: /Frontend summit/ }),
    ).toBeNull();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Edit event' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('defaults to the default variant, outline selection and no elevation', () => {
    renderUI(<Card>Content</Card>);
    expect(screen.getByText('Content')).toHaveClass(
      variants.variant.default,
      variants.selection.outline,
      variants.elevated.false,
    );
  });

  it('applies variant and look', () => {
    renderUI(
      <Card variant="base" look="ghost filled elevated">
        Content
      </Card>,
    );
    expect(screen.getByText('Content')).toHaveClass(
      variants.variant.base,
      variants.ghost.true,
      variants.selection.filled,
      variants.elevated.true,
    );
  });

  it('static with a disabled reason: only looks disabled, and the reason still shows', async () => {
    const { container } = renderUI(
      <>
        <Card disabledWithReason="Archived">
          <strong>Old event</strong>
        </Card>
        <button type="button">Next field</button>
      </>,
    );
    const card = screen.getByText('Old event').parentElement!;
    // Not a control, so no disabled state for assistive tech...
    expect(card).toHaveAttribute('data-disabled', 'true');
    expect(card).not.toHaveAttribute('aria-disabled');
    expect(card).not.toHaveAttribute('tabindex');
    // ...but the reason is wired up and shown on hover.
    expect(card).toHaveAccessibleDescription('Archived');
    await userEvent.hover(screen.getByText('Old event'));
    expect(await tooltipEntries()).toEqual(['Archived']);
    await userEvent.unhover(screen.getByText('Old event'));

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with onClick it is one button, named by its title, that Enter and Space press', async () => {
    const onClick = jest.fn();
    const Clickable = () => {
      const titleId = useId();
      const detailsId = useId();
      return (
        <Card
          onClick={onClick}
          aria-labelledby={titleId}
          aria-describedby={detailsId}
        >
          <strong id={titleId}>Workshop template</strong>
          <span id={detailsId}>Sessions, breaks and a sign-up list</span>
        </Card>
      );
    };
    const { container } = renderUI(<Clickable />);
    const card = screen.getByRole('button', { name: 'Workshop template' });
    expect(card).toHaveAccessibleDescription(
      'Sessions, breaks and a sign-up list',
    );

    await userEvent.tab();
    expect(card).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('[Space]');
    expect(onClick).toHaveBeenCalledTimes(2);
    await userEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('clickable and disabled: ignores clicks, Enter and Space, and leaves the tab order', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <>
        <Card disabled onClick={onClick}>
          Content
        </Card>
        <button type="button">Next field</button>
      </>,
    );
    const card = screen.getByRole('button', { name: 'Content' });
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAttribute('tabindex', '-1');

    await userEvent.click(card);
    card.focus();
    await userEvent.keyboard('{Enter}[Space]');
    expect(onClick).not.toHaveBeenCalled();

    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('clickable with a disabled reason: keeps its tab stop so the reason is reachable, never presses', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Card
        onClick={onClick}
        disabledWithReason="Archived events can't be copied"
      >
        <strong>Copy event</strong>
      </Card>,
    );
    const card = screen.getByRole('button', { name: 'Copy event' });
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAttribute('tabindex', '0');
    expect(card).toHaveAccessibleDescription(
      "Archived events can't be copied",
    );

    await userEvent.tab();
    expect(card).toHaveFocus();
    await userEvent.keyboard('{Enter}[Space]');
    await userEvent.click(card);
    expect(onClick).not.toHaveBeenCalled();

    await userEvent.hover(card);
    expect(await tooltipEntries()).toEqual([
      "Archived events can't be copied",
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('clickable with a read-only reason: focusable and described by it, never presses', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Card
        onClick={onClick}
        readOnlyWithReason="Only organizers can change this"
      >
        <strong>Change venue</strong>
      </Card>,
    );
    const card = screen.getByRole('button', { name: 'Change venue' });
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAccessibleDescription(
      'Only organizers can change this',
    );

    await userEvent.tab();
    expect(card).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(card);
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggles as a checkbox once it opts in, by click and by Space', async () => {
    const onActiveChange = jest.fn();
    const Toggle = () => {
      const [lunch, setLunch] = useState(false);
      return (
        <Card
          look="elevated"
          active={lunch}
          onActiveChange={(active) => {
            onActiveChange(active);
            setLunch(active);
          }}
        >
          Backups
        </Card>
      );
    };
    const { container } = renderUI(<Toggle />);
    const card = screen.getByRole('checkbox', { name: 'Backups' });
    expect(card).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(card);
    expect(card).toHaveAttribute('aria-checked', 'true');
    expect(onActiveChange).toHaveBeenLastCalledWith(true);

    // The click focused it, as Tab would.
    expect(card).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(card).toHaveAttribute('aria-checked', 'false');
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
    // A checkbox is Space's alone: Enter does not toggle it.
    await userEvent.keyboard('{Enter}');
    expect(card).toHaveAttribute('aria-checked', 'false');
    expect(onActiveChange).toHaveBeenCalledTimes(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggle disabled: out of the tab order silently, in it with a reason, never toggles', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <>
        <Card active={false} onActiveChange={onActiveChange} disabled>
          Silent
        </Card>
        <Card
          active={false}
          onActiveChange={onActiveChange}
          disabledWithReason="Sold out"
        >
          Explained
        </Card>
        <button type="button">Next field</button>
      </>,
    );
    const silent = screen.getByRole('checkbox', { name: 'Silent' });
    const explained = screen.getByRole('checkbox', { name: 'Explained' });
    expect(silent).toHaveAttribute('aria-disabled', 'true');
    expect(silent).toHaveAttribute('tabindex', '-1');
    expect(explained).toHaveAttribute('aria-disabled', 'true');
    expect(explained).toHaveAttribute('tabindex', '0');
    expect(explained).toHaveAccessibleDescription('Sold out');

    await userEvent.tab();
    expect(explained).toHaveFocus();
    await userEvent.keyboard('[Space]');
    await userEvent.click(explained);
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(explained).toHaveAttribute('aria-checked', 'false');

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();

    await userEvent.click(silent);
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(silent).toHaveAttribute('aria-checked', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggle with a read-only reason: focusable, described by it, keeps its state', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <Card
        active
        onActiveChange={onActiveChange}
        readOnlyWithReason="Set by your ticket"
      >
        Attendee badge
      </Card>,
    );
    const card = screen.getByRole('checkbox', { name: 'Attendee badge' });
    expect(card).toHaveAttribute('aria-checked', 'true');
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAccessibleDescription('Set by your ticket');

    await userEvent.tab();
    expect(card).toHaveFocus();
    await userEvent.keyboard('[Space]');
    await userEvent.click(card);
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(card).toHaveAttribute('aria-checked', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('CardGroup', () => {
  it('selects one card in single mode, outlined whatever the selection prop', async () => {
    const onChange = jest.fn();
    const Plans = () => {
      const [plan, setPlan] = useState('free');
      return (
        <CardGroup
          mode="single"
          value={plan}
          onChange={(value) => {
            onChange(value);
            setPlan(value);
          }}
          aria-label="Plan"
        >
          <Card value="free" look="elevated">
            Free
          </Card>
          <Card value="pro" look="elevated filled">
            Pro
          </Card>
        </CardGroup>
      );
    };
    const { container } = renderUI(<Plans />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    const pro = screen.getByRole('radio', { name: 'Pro' });
    await userEvent.click(pro);
    expect(onChange).toHaveBeenLastCalledWith('pro');
    expect(pro).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Free' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(pro).toHaveClass(variants.selection.outline, variants.elevated.true);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('single mode has one tab stop at the chosen card; arrows move and select, Home and End only move', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const Plans = () => {
      const [plan, setPlan] = useState('free');
      return (
        <CardGroup
          mode="single"
          value={plan}
          onChange={(value) => {
            onChange(value);
            setPlan(value);
          }}
          aria-label="Plan"
        >
          <Card value="free">Free</Card>
          <Card value="pro">Pro</Card>
          <Card value="team">Team</Card>
        </CardGroup>
      );
    };
    const { container } = renderUI(<Plans />);
    const free = screen.getByRole('radio', { name: 'Free' });
    const pro = screen.getByRole('radio', { name: 'Pro' });
    const team = screen.getByRole('radio', { name: 'Team' });

    await user.tab();
    expect(free).toHaveFocus();

    await arrowTo(user, 'ArrowRight', pro);
    expect(onChange).toHaveBeenLastCalledWith('pro');
    expect(pro).toHaveAttribute('aria-checked', 'true');

    await arrowTo(user, 'ArrowDown', team);
    expect(onChange).toHaveBeenLastCalledWith('team');

    // Arrows wrap around the end of the group.
    await arrowTo(user, 'ArrowRight', free);
    expect(onChange).toHaveBeenLastCalledWith('free');
    await arrowTo(user, 'ArrowLeft', team);
    expect(onChange).toHaveBeenLastCalledWith('team');

    // Home and End move focus only; Space picks the focused card.
    onChange.mockClear();
    await arrowTo(user, 'Home', free);
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('[Space]');
    expect(onChange).toHaveBeenLastCalledWith('free');
    await arrowTo(user, 'End', team);
    expect(onChange).toHaveBeenLastCalledWith('free');
    await user.keyboard('[Space]');
    expect(onChange).toHaveBeenLastCalledWith('team');

    // Tab leaves the whole group, and coming back lands on the chosen card.
    await user.tab();
    expect(team).not.toHaveFocus();
    expect(document.activeElement).toBe(document.body);
    await user.tab({ shift: true });
    await waitFor(() => expect(team).toHaveFocus());
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a card with a reason stays reachable by the arrow keys but cannot be picked; a silently disabled one is skipped', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const Seating = () => {
      const [seating, setSeating] = useState('standard');
      return (
        <CardGroup
          mode="single"
          value={seating}
          onChange={(value) => {
            onChange(value);
            setSeating(value);
          }}
          aria-label="Seating"
        >
          <Card value="standard">Standard seating</Card>
          <Card value="front" disabledWithReason="Front row is sold out">
            Front row
          </Card>
          <Card value="balcony" disabled>
            Balcony
          </Card>
          <Card value="box">Box</Card>
        </CardGroup>
      );
    };
    const { container } = renderUI(<Seating />);
    const standard = screen.getByRole('radio', { name: 'Standard seating' });
    const front = screen.getByRole('radio', { name: 'Front row' });
    const balcony = screen.getByRole('radio', { name: 'Balcony' });
    const box = screen.getByRole('radio', { name: 'Box' });
    expect(front).toHaveAttribute('aria-disabled', 'true');
    expect(front).toHaveAccessibleDescription('Front row is sold out');
    expect(balcony).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(standard).toHaveFocus();
    // The arrow keys stop at the explained card so its reason can be read...
    await arrowTo(user, 'ArrowRight', front);
    expect(onChange).not.toHaveBeenCalled();
    expect(front).toHaveAttribute('aria-checked', 'false');
    expect(standard).toHaveAttribute('aria-checked', 'true');
    // ...and skip the silently disabled one altogether.
    await arrowTo(user, 'ArrowRight', box);
    expect(onChange).toHaveBeenLastCalledWith('box');

    await user.click(front);
    front.focus();
    await user.keyboard('[Space]');
    await user.click(balcony);
    expect(onChange).toHaveBeenLastCalledWith('box');
    expect(front).toHaveAttribute('aria-checked', 'false');
    expect(balcony).toHaveAttribute('aria-checked', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });

  it("the group's reason reaches every card, and a card's own reason wins", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const Plans = () => {
      const [plan, setPlan] = useState('full');
      return (
        <CardGroup
          mode="single"
          value={plan}
          onChange={(value) => {
            onChange(value);
            setPlan(value);
          }}
          aria-label="Payment plan"
          disabledWithReason="Payment plans are set by your organizer"
        >
          <Card value="full">Pay in full</Card>
          <Card value="installments">Installments</Card>
          <Card value="sponsored" disabledWithReason="Sponsors are invited">
            Sponsored
          </Card>
        </CardGroup>
      );
    };
    const { container } = renderUI(<Plans />);
    const full = screen.getByRole('radio', { name: 'Pay in full' });
    const installments = screen.getByRole('radio', { name: 'Installments' });
    const sponsored = screen.getByRole('radio', { name: 'Sponsored' });
    for (const card of [full, installments, sponsored]) {
      expect(card).toHaveAttribute('aria-disabled', 'true');
    }
    expect(full).toHaveAccessibleDescription(
      'Payment plans are set by your organizer',
    );
    expect(installments).toHaveAccessibleDescription(
      'Payment plans are set by your organizer',
    );
    expect(sponsored).toHaveAccessibleDescription('Sponsors are invited');

    // The group is still one tab stop, and the arrows still move through it
    // so each reason can be read; nothing can be picked.
    await user.tab();
    expect(full).toHaveFocus();
    await arrowTo(user, 'ArrowRight', installments);
    await user.click(installments);
    await user.keyboard('[Space]');
    expect(onChange).not.toHaveBeenCalled();
    expect(full).toHaveAttribute('aria-checked', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggles cards in multiple mode, filled, each card its own tab stop', async () => {
    const onChange = jest.fn();
    const Extras = () => {
      const [extras, setExtras] = useState<string[]>(['backups']);
      return (
        <CardGroup
          mode="multiple"
          value={extras}
          onChange={(value) => {
            onChange(value);
            setExtras(value);
          }}
          aria-label="Extras"
        >
          <Card value="backups" look="elevated">
            Backups
          </Card>
          <Card value="support" look="elevated">
            Support
          </Card>
        </CardGroup>
      );
    };
    const { container } = renderUI(<Extras />);
    expect(screen.getByRole('group', { name: 'Extras' })).toBeInTheDocument();
    const backups = screen.getByRole('checkbox', { name: 'Backups' });
    const support = screen.getByRole('checkbox', { name: 'Support' });
    await userEvent.click(support);
    expect(onChange).toHaveBeenLastCalledWith(['backups', 'support']);
    expect(support).toHaveAttribute('aria-checked', 'true');
    expect(support).toHaveClass(
      variants.selection.filled,
      variants.elevated.true,
    );

    // No roving focus here: Tab visits every card, arrows do nothing.
    support.blur();
    await userEvent.tab();
    expect(backups).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(backups).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(onChange).toHaveBeenLastCalledWith(['support']);
    await userEvent.tab();
    expect(support).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a silently disabled multiple group leaves the tab order and cannot change', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <>
        <CardGroup
          mode="multiple"
          value={['backups']}
          onChange={onChange}
          aria-label="Extras"
          disabled
        >
          <Card value="backups">Backups</Card>
          <Card value="support">Support</Card>
        </CardGroup>
        <button type="button">Next field</button>
      </>,
    );
    const backups = screen.getByRole('checkbox', { name: 'Backups' });
    const support = screen.getByRole('checkbox', { name: 'Support' });
    expect(backups).toHaveAttribute('aria-disabled', 'true');
    expect(backups).toHaveAttribute('tabindex', '-1');
    expect(support).toHaveAttribute('tabindex', '-1');

    await userEvent.click(support);
    support.focus();
    await userEvent.keyboard('[Space]');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is named by its label, and clicking the label focuses the chosen card', async () => {
    const Plans = () => {
      const [plan, setPlan] = useState('pro');
      return (
        <CardGroup mode="single" label="Plan" value={plan} onChange={setPlan}>
          <Card value="free">Free</Card>
          <Card value="pro">Pro</Card>
        </CardGroup>
      );
    };
    const { container } = renderUI(<Plans />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('Plan'));
    expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('in a form: a failed submit shows the error on the group and focuses the first card', async () => {
    type Registration = { ticket: string };
    const TicketForm = () => {
      const { control, handleSubmit } = useForm<Registration>({
        defaultValues: { ticket: '' },
      });
      return (
        <form noValidate onSubmit={handleSubmit(() => undefined)}>
          <Controller
            name="ticket"
            control={control}
            rules={{ required: 'Choose a ticket' }}
          >
            {({ field }) => (
              <CardGroup mode="single" label="Ticket" {...field}>
                <Card value="general">
                  <strong>General</strong>
                </Card>
                <Card value="vip">
                  <strong>VIP</strong>
                </Card>
              </CardGroup>
            )}
          </Controller>
          <Button type="submit">Register</Button>
        </form>
      );
    };
    const { container } = renderUI(<TicketForm />);
    const group = screen.getByRole('radiogroup', { name: 'Ticket' });
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).not.toHaveAttribute('aria-invalid');

    await userEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('Choose a ticket')).toBeInTheDocument();
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Choose a ticket');
    // Nothing is chosen yet, so the first card takes the focus.
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'General' })).toHaveFocus(),
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
