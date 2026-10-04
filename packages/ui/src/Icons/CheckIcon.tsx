import { Check, type LucideProps } from 'lucide-react';
import React from 'react';

export type CheckIconProps = LucideProps;

/** @invalidAlternative Check */
export const CheckIcon = (props: CheckIconProps) => {
  return <Check strokeWidth={3} {...props} />;
};
