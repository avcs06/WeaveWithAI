import { classNames } from '@packages/styles/classNames';
import { LoaderCircle, type LucideProps } from 'lucide-react';
import React from 'react';

export type LoadingIconProps = LucideProps;

/** @invalidAlternative LoaderCircle */
export const LoadingIcon = ({ className, ...props }: LoadingIconProps) => {
  return (
    <LoaderCircle
      aria-label="Loading"
      className={classNames('animate-spin', className)}
      {...props}
    />
  );
};
