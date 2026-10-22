import { screen } from '@testing-library/react';
import { ArrowRight } from 'lucide-react';
import React from 'react';

import { Button } from '../Button';
import { axe, renderUI } from '../test-utils';

import { DropdownButton } from './auxiliary';

const button = (name: string) => screen.getByRole('button', { name });

describe('DropdownButton', () => {
  it('is a base button with a chevron down', async () => {
    const { container } = renderUI(
      <>
        <DropdownButton>Actions</DropdownButton>
        <Button variant="base">Base</Button>
      </>,
    );
    expect(button('Actions').className).toBe(button('Base').className);
    expect(
      button('Actions').querySelector('.lucide-chevron-down'),
    ).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes another variant and right icon', () => {
    renderUI(
      <>
        <DropdownButton look="ghost" rightIcon={<ArrowRight />}>
          More
        </DropdownButton>
        <Button variant="base" look="ghost">
          Ghost
        </Button>
      </>,
    );
    expect(button('More').className).toBe(button('Ghost').className);
    expect(button('More').querySelector('.lucide-arrow-right')).not.toBeNull();
  });
});
