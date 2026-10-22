import { screen } from '@testing-library/react';
import React from 'react';

import { Button } from '../Button';
import { axe, renderUI } from '../test-utils';

import { PopoverButton } from './auxiliary';

const button = (name: string) => screen.getByRole('button', { name });

describe('PopoverButton', () => {
  it('is a base button with up and down chevrons', async () => {
    const { container } = renderUI(
      <>
        <PopoverButton>Filters</PopoverButton>
        <Button variant="base">Base</Button>
      </>,
    );
    expect(button('Filters').className).toBe(button('Base').className);
    expect(
      button('Filters').querySelector('.lucide-chevrons-up-down'),
    ).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});
