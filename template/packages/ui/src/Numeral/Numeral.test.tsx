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
    const digits = screen.getByText('1,834');
    expect(digits).toHaveClass(numeral);
    const figure = digits.parentElement!;
    expect(figure.tagName).toBe('SPAN');
    expect(figure).toHaveClass('shrink-0');
    expect(figure).toHaveAttribute('aria-live', 'polite');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('takes a number as it is', () => {
    renderUI(<Numeral>{0}</Numeral>);
    expect(screen.getByText('0')).toHaveClass(numeral);
  });

  it('sets only the digits in the mono font: the sign, unit and words around them keep the text font', () => {
    const { container } = renderUI(
      <Numeral>{'₹1,500.50 · 32 left, €1.250,50, 12%'}</Numeral>,
    );
    const figures = Array.from(container.querySelectorAll(`.${numeral}`)).map(
      (figure) => figure.textContent,
    );
    expect(figures).toEqual(['1,500.50', '32', '1.250,50', '12']);
    expect(container.textContent).toBe('₹1,500.50 · 32 left, €1.250,50, 12%');
  });
});
