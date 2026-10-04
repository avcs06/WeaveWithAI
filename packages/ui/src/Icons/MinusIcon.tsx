import { Minus, type LucideProps } from 'lucide-react';
import React from 'react';

export type MinusIconProps = LucideProps;

/** @invalidAlternative Minus */
export const MinusIcon = (props: MinusIconProps) => {
  return <Minus strokeWidth={3} {...props} />;
};
