import { Check, type LucideProps } from 'lucide-react';
import React from 'react';

export type CheckIconProps = LucideProps;

/**
 * The check mark of checkboxes and selected rows, drawn heavier than a plain icon to read at small sizes.
 * General check glyphs come from lucide-react.
 */
export const CheckIcon = (props: CheckIconProps) => {
  return <Check strokeWidth={3} {...props} />;
};
