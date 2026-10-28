import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import React, { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '../Button';
import { Controller } from '../Form';
import { axe, renderUI } from '../test-utils';

import { Chip, ChipGroup } from './Chip';
import { chipGroupRecipe, chipRecipe } from './Chip.recipes.css';

import type { DisabledProps } from '../utils';

const { variants } = chipRecipe.classNames;

// The shown tooltip is aria-hidden; the trigger's description says the same, so
// role queries need `hidden`.
const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

// Radix moves radio focus on a timer and selects the landing item only while
// the arrow key is down, as for a person: hold the key until focus arrives,
// then release it.
const arrowTo = async (
  user: ReturnType<typeof userEvent.setup>,
  key: string,
  element: HTMLElement,
) => {
  await user.keyboard(`{${key}>}`);
  await waitFor(() => expect(element).toHaveFocus());
  await user.keyboard(`{/${key}}`);
};

// One independent toggle chip, controlled as the recipe's filters are.
const ToggleChip = ({
  onActiveChange = () => undefined,
  ...props
}: Omit<
  React.ComponentProps<typeof Chip>,
  | 'active'
  | 'onActiveChange'
  | 'value'
  | 'disabled'
  | 'disabledWithReason'
  | 'readOnly'
  | 'readOnlyWithReason'
  | 'loading'
  | 'loadingWithReason'
  | 'disableWhileLoading'
> &
  DisabledProps & { onActiveChange?: (active: boolean) => void }) => {
  const [active, setActive] = useState(false);
  return (
    <Chip
      {...props}
      active={active}
      onActiveChange={(next) => {
        onActiveChange(next);
        setActive(next);
      }}
    />
  );
};

describe('Chip', () => {
  it('reports its checked state', async () => {
    const { container } = renderUI(
      <>
        <ToggleChip>Default</ToggleChip>
        <Chip active onActiveChange={() => undefined}>
          Active
        </Chip>
        <Chip active look="rounded" onActiveChange={() => undefined}>
          Pill
        </Chip>
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Default' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('checkbox', { name: 'Active' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('checkbox', { name: 'Pill' })).toHaveAttribute(
      'type',
      'button',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggles by click and by Space, not by Enter', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <ToggleChip leftIcon={<Star />} onActiveChange={onActiveChange}>
        Starred only
      </ToggleChip>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Starred only' });

    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-checked', 'true');
    expect(onActiveChange).toHaveBeenLastCalledWith(true);

    await userEvent.tab({ shift: true });
    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(chip).toHaveAttribute('aria-checked', 'false');
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
    // A checkbox is Space's alone: Enter does not toggle it.
    await userEvent.keyboard('{Enter}');
    expect(chip).toHaveAttribute('aria-checked', 'false');
    expect(onActiveChange).toHaveBeenCalledTimes(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies variant, size and look', async () => {
    const { container } = renderUI(
      <>
        <Chip
          variant="base"
          look="ghost filled"
          active
          onActiveChange={() => undefined}
        >
          Ghost
        </Chip>
        <Chip size="md" active={false} onActiveChange={() => undefined}>
          Medium
        </Chip>
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Ghost' })).toHaveClass(
      variants.variant.base,
      variants.ghost.true,
      variants.selection.filled,
    );
    expect(screen.getByRole('checkbox', { name: 'Medium' })).toHaveClass(
      variants.size.md,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('its tooltip becomes its description and shows on hover', async () => {
    const { container } = renderUI(
      <Chip
        active
        onActiveChange={() => undefined}
        tooltip="Events with at least one ticket left"
      >
        Tickets available
      </Chip>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Tickets available' });
    expect(chip).toHaveAccessibleDescription(
      'Events with at least one ticket left',
    );
    await userEvent.hover(chip);
    expect(await tooltipEntries()).toEqual([
      'Events with at least one ticket left',
    ]);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('with no toggle and no group it is a plain button', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(<Chip onClick={onClick}>Checked in</Chip>);
    const chip = screen.getByRole('button', { name: 'Checked in' });
    expect(chip).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('checkbox')).toBeNull();
    await userEvent.click(chip);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: ignores clicks and leaves the tab order', async () => {
    const onClick = jest.fn();
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <>
        <ToggleChip disabled onClick={onClick} onActiveChange={onActiveChange}>
          Off
        </ToggleChip>
        <button type="button">Next field</button>
      </>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Off' });
    expect(chip).not.toBeDisabled();
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAttribute('data-disabled', 'true');
    expect(chip).toHaveAttribute('tabindex', '-1');

    await userEvent.click(chip);
    chip.focus();
    await userEvent.keyboard('[Space]{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(chip).toHaveAttribute('aria-checked', 'false');

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with a disabled reason: keeps its tab stop, the reason is its description, it never toggles', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <ToggleChip
        disabledWithReason="Early bird sales have ended"
        onActiveChange={onActiveChange}
      >
        Early bird
      </ToggleChip>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Early bird' });
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).not.toHaveAttribute('tabindex', '-1');
    expect(chip).toHaveAccessibleDescription('Early bird sales have ended');

    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.keyboard('[Space]');
    await userEvent.click(chip);
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(chip).toHaveAttribute('aria-checked', 'false');

    await userEvent.hover(chip);
    expect(await tooltipEntries()).toEqual(['Early bird sales have ended']);
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('with a read-only reason: focusable, described by it, keeps its state', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <Chip
        active
        onActiveChange={onActiveChange}
        readOnlyWithReason="Set by the organizer"
      >
        Featured
      </Chip>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Featured' });
    expect(chip).toHaveAttribute('aria-checked', 'true');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAccessibleDescription('Set by the organizer');

    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.keyboard('[Space]');
    await userEvent.click(chip);
    expect(onActiveChange).not.toHaveBeenCalled();
    expect(chip).toHaveAttribute('aria-checked', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading with a reason: busy, announced, keeps its tab stop, cannot be pressed', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Chip loadingWithReason="Updating the attendee list" onClick={onClick}>
        Checked in
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: 'Checked in' });
    expect(chip).toHaveAttribute('aria-busy', 'true');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).not.toHaveAttribute('tabindex', '-1');
    expect(chip).toHaveAccessibleDescription('Updating the attendee list');
    // aria-busy alone is not announced: a live region says why.
    expect(screen.getByRole('status')).toHaveTextContent(
      'Updating the attendee list',
    );

    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.keyboard('[Space]');
    await userEvent.click(chip);
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading silently: a spinner takes the icon slot and it leaves the tab order', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <>
        <ToggleChip
          loading
          leftIcon={<Star data-testid="icon" />}
          onActiveChange={onActiveChange}
        >
          Saving filter
        </ToggleChip>
        <button type="button">Next field</button>
      </>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Saving filter' });
    expect(screen.queryByTestId('icon')).toBeNull();
    expect(chip).toHaveAttribute('aria-busy', 'true');
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');

    await userEvent.click(chip);
    expect(onActiveChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('loading with disableWhileLoading={false}: busy but still toggleable', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <ToggleChip
        loading
        disableWhileLoading={false}
        onActiveChange={onActiveChange}
      >
        Live results
      </ToggleChip>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Live results' });
    expect(chip).toHaveAttribute('aria-busy', 'true');
    expect(chip).not.toHaveAttribute('aria-disabled');

    await userEvent.tab();
    expect(chip).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(chip).toHaveAttribute('aria-checked', 'true');
    expect(onActiveChange).toHaveBeenLastCalledWith(true);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('ChipGroup', () => {
  it('selects one chip in single mode, outlined whatever the look prop, named by its heading', async () => {
    const onChange = jest.fn();
    const Ranges = () => {
      const headingId = useId();
      const [range, setRange] = useState('30d');
      return (
        <div>
          <h3 id={headingId}>Show events from the last</h3>
          <ChipGroup
            mode="single"
            aria-labelledby={headingId}
            value={range}
            onChange={(value) => {
              onChange(value);
              setRange(value);
            }}
          >
            <Chip value="7d" look="filled">
              7 days
            </Chip>
            <Chip value="30d">30 days</Chip>
          </ChipGroup>
        </div>
      );
    };
    const { container } = renderUI(<Ranges />);
    expect(
      screen.getByRole('radiogroup', { name: 'Show events from the last' }),
    ).toBeInTheDocument();
    const week = screen.getByRole('radio', { name: '7 days' });
    expect(week).toHaveClass(
      variants.variant.default,
      variants.selection.outline,
    );

    await userEvent.click(week);
    expect(onChange).toHaveBeenLastCalledWith('7d');
    expect(week).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '30 days' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('single mode has one tab stop at the chosen chip, and the arrows move and select', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const Ranges = () => {
      const [range, setRange] = useState('30d');
      return (
        <ChipGroup
          mode="single"
          aria-label="Range"
          value={range}
          onChange={(value) => {
            onChange(value);
            setRange(value);
          }}
        >
          <Chip value="7d">7 days</Chip>
          <Chip value="30d">30 days</Chip>
          <Chip value="90d">90 days</Chip>
        </ChipGroup>
      );
    };
    const { container } = renderUI(<Ranges />);
    const month = screen.getByRole('radio', { name: '30 days' });
    const quarter = screen.getByRole('radio', { name: '90 days' });
    const week = screen.getByRole('radio', { name: '7 days' });

    await user.tab();
    expect(month).toHaveFocus();
    await arrowTo(user, 'ArrowRight', quarter);
    expect(onChange).toHaveBeenLastCalledWith('90d');
    expect(quarter).toHaveAttribute('aria-checked', 'true');
    await arrowTo(user, 'ArrowUp', month);
    expect(onChange).toHaveBeenLastCalledWith('30d');
    await arrowTo(user, 'ArrowLeft', week);
    expect(onChange).toHaveBeenLastCalledWith('7d');

    // Tab leaves the whole group, and coming back lands on the chosen chip.
    await user.tab();
    expect(document.activeElement).toBe(document.body);
    await user.tab({ shift: true });
    await waitFor(() => expect(week).toHaveFocus());
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a chip with a reason stays reachable by the arrow keys but cannot be picked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const Ranges = () => {
      const [range, setRange] = useState('30d');
      return (
        <ChipGroup
          mode="single"
          aria-label="Range"
          value={range}
          onChange={(value) => {
            onChange(value);
            setRange(value);
          }}
        >
          <Chip value="7d">7 days</Chip>
          <Chip value="30d">30 days</Chip>
          <Chip value="90d" disabledWithReason="90 days needs a Pro plan">
            90 days
          </Chip>
          <Chip value="year" disabled>
            1 year
          </Chip>
        </ChipGroup>
      );
    };
    const { container } = renderUI(<Ranges />);
    const month = screen.getByRole('radio', { name: '30 days' });
    const quarter = screen.getByRole('radio', { name: '90 days' });
    const year = screen.getByRole('radio', { name: '1 year' });
    const week = screen.getByRole('radio', { name: '7 days' });
    expect(quarter).toHaveAttribute('aria-disabled', 'true');
    expect(quarter).toHaveAccessibleDescription('90 days needs a Pro plan');
    expect(year).toHaveAttribute('aria-disabled', 'true');

    await user.tab();
    expect(month).toHaveFocus();
    await arrowTo(user, 'ArrowRight', quarter);
    expect(onChange).not.toHaveBeenCalled();
    expect(quarter).toHaveAttribute('aria-checked', 'false');
    expect(month).toHaveAttribute('aria-checked', 'true');
    // The next arrow skips the silently disabled chip and wraps around.
    await arrowTo(user, 'ArrowRight', week);
    expect(onChange).toHaveBeenLastCalledWith('7d');

    await user.click(quarter);
    quarter.focus();
    await user.keyboard('[Space]');
    await user.click(year);
    expect(onChange).toHaveBeenLastCalledWith('7d');
    expect(quarter).toHaveAttribute('aria-checked', 'false');
    expect(year).toHaveAttribute('aria-checked', 'false');
    expect(await axe(container)).toHaveNoViolations();
  });

  it("the group's reason reaches every chip, and a chip's own reason wins", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const Tickets = () => {
      const [ticket, setTicket] = useState('general');
      return (
        <ChipGroup
          disabledWithReason="Ticket type is fixed after checkout"
          aria-label="Ticket type"
          value={ticket}
          onChange={(value) => {
            onChange(value);
            setTicket(value);
          }}
        >
          <Chip value="general">General</Chip>
          <Chip value="vip">VIP</Chip>
          <Chip value="speaker" disabledWithReason="Speakers are invited">
            Speaker
          </Chip>
        </ChipGroup>
      );
    };
    const { container } = renderUI(<Tickets />);
    const general = screen.getByRole('radio', { name: 'General' });
    const vip = screen.getByRole('radio', { name: 'VIP' });
    const speaker = screen.getByRole('radio', { name: 'Speaker' });
    for (const chip of [general, vip, speaker]) {
      expect(chip).toHaveAttribute('aria-disabled', 'true');
    }
    expect(general).toHaveAccessibleDescription(
      'Ticket type is fixed after checkout',
    );
    expect(vip).toHaveAccessibleDescription(
      'Ticket type is fixed after checkout',
    );
    expect(speaker).toHaveAccessibleDescription('Speakers are invited');

    await user.tab();
    expect(general).toHaveFocus();
    await arrowTo(user, 'ArrowRight', vip);
    await user.click(vip);
    await user.keyboard('[Space]');
    expect(onChange).not.toHaveBeenCalled();
    expect(general).toHaveAttribute('aria-checked', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('toggles chips in multiple mode, filled, each chip its own tab stop', async () => {
    const onChange = jest.fn();
    const Statuses = () => {
      const [selected, setSelected] = useState<string[]>(['published']);
      return (
        <ChipGroup
          mode="multiple"
          aria-label="Event status"
          value={selected}
          onChange={(value) => {
            onChange(value);
            setSelected(value);
          }}
        >
          <Chip value="published" variant="base">
            Published
          </Chip>
          <Chip value="draft">Draft</Chip>
        </ChipGroup>
      );
    };
    const { container } = renderUI(<Statuses />);
    expect(
      screen.getByRole('group', { name: 'Event status' }),
    ).toBeInTheDocument();
    const published = screen.getByRole('checkbox', { name: 'Published' });
    const draft = screen.getByRole('checkbox', { name: 'Draft' });
    expect(published).toHaveClass(
      variants.variant.base,
      variants.selection.filled,
    );

    await userEvent.click(draft);
    expect(onChange).toHaveBeenLastCalledWith(['published', 'draft']);
    expect(draft).toHaveAttribute('aria-checked', 'true');

    // No roving focus here: Tab visits every chip, arrows do nothing.
    draft.blur();
    await userEvent.tab();
    expect(published).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(published).toHaveFocus();
    await userEvent.keyboard('[Space]');
    expect(onChange).toHaveBeenLastCalledWith(['draft']);
    await userEvent.tab();
    expect(draft).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a silently disabled multiple group leaves the tab order and cannot change', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <>
        <ChipGroup
          mode="multiple"
          aria-label="Event status"
          value={['published']}
          onChange={onChange}
          disabled
        >
          <Chip value="published">Published</Chip>
          <Chip value="draft">Draft</Chip>
        </ChipGroup>
        <button type="button">Next field</button>
      </>,
    );
    const published = screen.getByRole('checkbox', { name: 'Published' });
    const draft = screen.getByRole('checkbox', { name: 'Draft' });
    expect(published).toHaveAttribute('aria-disabled', 'true');
    expect(published).toHaveAttribute('tabindex', '-1');
    expect(draft).toHaveAttribute('tabindex', '-1');

    await userEvent.click(draft);
    draft.focus();
    await userEvent.keyboard('[Space]');
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('look="collapsed" joins the chips into one bar and keeps the group\'s behavior', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <ChipGroup
        aria-label="Range"
        look="collapsed"
        value="7d"
        onChange={onChange}
      >
        <Chip value="7d">7 days</Chip>
        <Chip value="30d">30 days</Chip>
      </ChipGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Range' });
    expect(group).toHaveClass(
      chipGroupRecipe.classNames.variants.collapsed.true,
      'inline-flex-row-gap-0',
    );
    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));
    expect(onChange).toHaveBeenLastCalledWith('30d');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('without a look, the group has no layout of its own', () => {
    renderUI(
      <ChipGroup aria-label="Range" value="7d" onChange={() => undefined}>
        <Chip value="7d">7 days</Chip>
      </ChipGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Range' });
    expect(group).toHaveClass(
      chipGroupRecipe.classNames.variants.collapsed.false,
    );
    expect(group).not.toHaveClass('inline-flex-row-gap-0');
  });

  it('in a form: named and helped by its label, and a failed submit focuses the group itself', async () => {
    type Interests = { tracks: string[] };
    const InterestsForm = () => {
      const [status, setStatus] = useState('');
      const { control, handleSubmit } = useForm<Interests>({
        defaultValues: { tracks: [] },
      });
      return (
        <form
          noValidate
          onSubmit={handleSubmit((interests) =>
            setStatus(`Saved ${interests.tracks.join(', ')}`),
          )}
        >
          <Controller
            name="tracks"
            control={control}
            rules={{
              validate: (value) =>
                value.length > 0 || 'Pick at least one track',
            }}
          >
            {({ field }) => (
              <ChipGroup
                mode="multiple"
                label="Tracks"
                helpText="We'll suggest sessions from these."
                {...field}
              >
                <Chip value="Design">Design</Chip>
                <Chip value="Engineering">Engineering</Chip>
              </ChipGroup>
            )}
          </Controller>
          <Button type="submit">Save</Button>
          <p role="status">{status}</p>
        </form>
      );
    };
    const { container } = renderUI(<InterestsForm />);
    const group = screen.getByRole('group', { name: 'Tracks' });
    expect(group).toHaveAccessibleDescription(
      "We'll suggest sessions from these.",
    );

    // The label focuses the group, which reads out its name and help...
    await userEvent.click(screen.getByText('Tracks', { selector: 'span' }));
    expect(group).toHaveFocus();
    // ...and Tab from there goes to the first chip.
    await userEvent.tab();
    expect(screen.getByRole('checkbox', { name: 'Design' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(
      await screen.findByText('Pick at least one track'),
    ).toBeInTheDocument();
    // The message leads the group's description, ahead of the help text.
    expect(group).toHaveAccessibleDescription(
      /Pick at least one track.*We'll suggest sessions from these\./,
    );
    await waitFor(() => expect(group).toHaveFocus());

    await userEvent.tab();
    await userEvent.keyboard('[Space]');
    expect(screen.getByRole('checkbox', { name: 'Design' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Saved Design')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
