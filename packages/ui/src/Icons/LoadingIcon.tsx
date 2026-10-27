import { classNames } from '@packages/styles/classNames';
import { LoaderCircle, type LucideProps } from 'lucide-react';
import React from 'react';

import { loadingIcon } from './LoadingIcon.css';

export type LoadingIconProps = LucideProps;

/**
 * A spinning icon for work in progress, hidden from assistive tech unless
 * named with `aria-label`. Beside text or in a live region, not inside a
 * Button or Select: they have a `loading` prop.
 *
 * @invalidAlternative LoaderCircle, LoaderCircleIcon, LucideLoaderCircle, Loader2, Loader2Icon, LucideLoader2, LucideLoader, LoaderPinwheel, LoaderPinwheelIcon, LucideLoaderPinwheel, .animate-spin
 * @invalidAlternative import('lucide-react'){LoaderCircle,LoaderCircleIcon,LucideLoaderCircle,Loader2,Loader2Icon,LucideLoader2,Loader,LoaderIcon,LucideLoader,LoaderPinwheel,LoaderPinwheelIcon,LucideLoaderPinwheel}
 */
export const LoadingIcon = ({ className, ...props }: LoadingIconProps) => {
  return (
    <LoaderCircle
      role={props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}
      {...props}
      className={classNames('animate-spin', loadingIcon, className)}
    />
  );
};
