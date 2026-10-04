import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Card, CardGroup } from './Card';
import { cardRecipe } from './Card.recipes.css';

const { variants } = cardRecipe.classNames;

describe('Card', () => {
  it('renders content and ignores clicks when disabled', async () => {
    const onClick = jest.fn();
    const { container } = renderUI(
      <Card disabled onClick={onClick}>
        Content
      </Card>,
    );
    await userEvent.click(screen.getByText('Content'));
    expect(onClick).not.toHaveBeenCalled();
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

  it('applies variant, selection and elevated', () => {
    renderUI(
      <Card variant="ghost" selection="filled" elevated>
        Content
      </Card>,
    );
    expect(screen.getByText('Content')).toHaveClass(
      variants.variant.ghost,
      variants.selection.filled,
      variants.elevated.true,
    );
  });

  it('toggles as a checkbox once it opts in', async () => {
    const onActiveChange = jest.fn();
    const { container } = renderUI(
      <Card elevated onActiveChange={onActiveChange}>
        Backups
      </Card>,
    );
    const card = screen.getByRole('checkbox', { name: 'Backups' });
    expect(card).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(card);
    expect(card).toHaveAttribute('aria-checked', 'true');
    expect(onActiveChange).toHaveBeenCalledWith(true);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('CardGroup', () => {
  it('selects one card in single mode, outlined whatever the selection prop', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <CardGroup
        mode="single"
        defaultValue="free"
        onChange={onChange}
        aria-label="Plan"
      >
        <Card value="free" elevated>
          Free
        </Card>
        <Card value="pro" elevated selection="filled">
          Pro
        </Card>
      </CardGroup>,
    );
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

  it('toggles cards in multiple mode, filled', async () => {
    const onChange = jest.fn();
    const { container } = renderUI(
      <CardGroup
        mode="multiple"
        defaultValue={['backups']}
        onChange={onChange}
        aria-label="Extras"
      >
        <Card value="backups" elevated>
          Backups
        </Card>
        <Card value="support" elevated>
          Support
        </Card>
      </CardGroup>,
    );
    const support = screen.getByRole('checkbox', { name: 'Support' });
    await userEvent.click(support);
    expect(onChange).toHaveBeenLastCalledWith(['backups', 'support']);
    expect(support).toHaveAttribute('aria-checked', 'true');
    expect(support).toHaveClass(
      variants.selection.filled,
      variants.elevated.true,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
