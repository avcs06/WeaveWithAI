'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { Tooltip } from '../Tooltip';

import { useTruncation } from './useTruncation';

import type { TruncateProps } from './Truncate.types';

/** For a tooltip of your own, use `tooltip` rather than wrapping it in a `Tooltip`. */
export const Truncate = ({
  tooltip,
  alwaysShowTooltip = false,
  className,
  children,
  ...props
}: TruncateProps) => {
  const {
    ref,
    className: truncateClassName,
    truncated,
  } = useTruncation<HTMLSpanElement>(children);

  const showTooltip = alwaysShowTooltip || truncated;

  return (
    <Tooltip tooltip={[tooltip, showTooltip && children]} portal={false}>
      <span
        {...props}
        ref={ref}
        className={classNames(truncateClassName, 'block', className)}
      >
        {children}
      </span>
    </Tooltip>
  );
};
