import type { ComponentPropsWithoutRef } from 'react';

export type NumeralProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & {
  /** The number as the user reads it, formatted: 1250, "1,250", "€49.50", "12%". */
  children: number | string;
};
