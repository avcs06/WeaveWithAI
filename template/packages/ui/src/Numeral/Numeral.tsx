import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { numeral } from './Numeral.css';

import type { NumeralProps } from './Numeral.types';

/**
 * A number the user reads and compares: a count, a total, a statistic, a
 * table's figures. Set in the theme's mono font; size, weight and color come
 * from around it.
 *
 * @invalidAlternative .tabular-nums
 */
export const Numeral = ({ className, ...props }: NumeralProps) => (
  <span {...props} data-ds="" className={classNames(numeral, className)} />
);
