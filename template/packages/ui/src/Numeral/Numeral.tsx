import React from 'react';

import { numeral } from './Numeral.css';

import type { NumeralProps } from './Numeral.types';

// Digits with the separators inside a number: "1,250.50", "1.250,50", "1 250".
const NUMBER = /(\d+(?:[.,\u00a0\u202f]\d+)*)/;

/**
 * A number the user reads and compares: a count, a total, a statistic, a
 * table's figures. Its digits are set in the theme's mono font; a currency
 * sign, a unit or words around them keep the text's font. Size, weight and
 * color come from around it.
 *
 * @invalidAlternative .tabular-nums
 */
export const Numeral = ({ children, ...props }: NumeralProps) => (
  <span {...props} data-ds="">
    {String(children)
      .split(NUMBER)
      .map((part, index) =>
        // Split on a group, the numbers fall at the odd places.
        index % 2 ? (
          <span key={index} data-ds="" className={numeral}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
  </span>
);
