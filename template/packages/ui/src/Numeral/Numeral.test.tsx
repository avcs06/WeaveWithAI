import { screen } from '@testing-library/react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Numeral } from './Numeral';
import { numeral } from './Numeral.css';

describe('Numeral', () => {
  it('sets the figure in a span with its style, keeping the caller’s class and attributes', async () => {
    const { container } = renderUI(
      <p>
        Pages read:{' '}
        <Numeral className="shrink-0" aria-live="polite">
          1,834
        </Numeral>
      </p>,
    );
    const figure = screen.getByText('1,834');
    expect(figure.tagName).toBe('SPAN');
    expect(figure).toHaveClass(numeral, 'shrink-0');
    expect(figure).toHaveAttribute('aria-live', 'polite');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes a number as it is', () => {
    renderUI(<Numeral>{0}</Numeral>);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
