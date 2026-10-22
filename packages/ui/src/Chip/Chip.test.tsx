import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Chip, ChipGroup } from './Chip';
import { chipRecipe } from './Chip.recipes.css';

const { variants } = chipRecipe.classNames;

describe('Chip', () => {
  it('reports its checked state', async () => {
    const { container } = renderUI(
      <>
        <Chip active={false}>Default</Chip>
        <Chip active>Active</Chip>
        <Chip active look="rounded">
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
    expect(await axe(container)).toHaveNoViolations();
  });

  it('when disabled: ignores clicks and leaves the tab order', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Chip disabled onClick={onClick}>
        Off
      </Chip>,
    );
    const chip = screen.getByRole('checkbox', { name: 'Off' });
    expect(chip).toHaveAttribute('aria-disabled', 'true');
    expect(chip).toHaveAttribute('tabindex', '-1');
    await userEvent.click(chip);
    expect(onClick).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies variant and look; in a group the mode picks outline or filled', async () => {
    const { container } = renderUI(
      <>
        <Chip variant="base" look="ghost filled" active>
          Ghost
        </Chip>
        <ChipGroup mode="single" defaultValue="design" aria-label="Team">
          <Chip value="design" look="filled">
            Design
          </Chip>
        </ChipGroup>
        <ChipGroup mode="multiple" defaultValue={['sales']} aria-label="Teams">
          <Chip value="sales" variant="base">
            Sales
          </Chip>
        </ChipGroup>
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Ghost' })).toHaveClass(
      variants.variant.base,
      variants.ghost.true,
      variants.selection.filled,
    );
    expect(screen.getByRole('radio', { name: 'Design' })).toHaveClass(
      variants.variant.default,
      variants.selection.outline,
    );
    expect(screen.getByRole('checkbox', { name: 'Sales' })).toHaveClass(
      variants.variant.base,
      variants.selection.filled,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
