import { Minus, type LucideProps } from 'lucide-react';
import React from 'react';

export type MinusIconProps = LucideProps;

/**
 * The minus mark of checkboxes and selected rows in a partly-on state, drawn heavier than a plain icon to read at small sizes.
 * General minus glyphs come from lucide-react.
 */
export const MinusIcon = (props: MinusIconProps) => {
  return <Minus strokeWidth={3} {...props} />;
};
