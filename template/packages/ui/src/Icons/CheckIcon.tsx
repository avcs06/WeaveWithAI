import { Check, type LucideProps } from 'lucide-react';
import React from 'react';

export type CheckIconProps = LucideProps;

/**
 * The check mark of checkboxes and selected rows, heavier than a plain icon for
 * small sizes. General checks come from lucide-react.
 */
export const CheckIcon = (props: CheckIconProps) => {
  return <Check strokeWidth={3} {...props} />;
};
