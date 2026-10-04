import { screen } from '@testing-library/react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { CheckIcon } from './CheckIcon';
import { LoadingIcon } from './LoadingIcon';
import { MinusIcon } from './MinusIcon';

describe('Icons', () => {
  it('LoadingIcon can be labelled', async () => {
    const { container } = renderUI(
      <LoadingIcon role="img" aria-label="Loading" />,
    );
    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('CheckIcon and MinusIcon draw with a heavier stroke and can be labelled', async () => {
    const { container } = renderUI(
      <>
        <CheckIcon role="img" aria-label="Checked" />
        <MinusIcon role="img" aria-label="Partly checked" />
      </>,
    );
    for (const name of ['Checked', 'Partly checked'])
      expect(screen.getByRole('img', { name })).toHaveAttribute(
        'stroke-width',
        '3',
      );
    expect(await axe(container)).toHaveNoViolations();
  });
});
