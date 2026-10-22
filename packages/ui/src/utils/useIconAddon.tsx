import { Slot } from '@radix-ui/react-slot';
import { ReactNode } from 'react';

import { LoadingIcon } from '../Icons';

import { fixedHeightIcon } from './icons';

export type IconAddonProps = {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftAddOn?: ReactNode;
  rightAddOn?: ReactNode;
  loading?: boolean;
  /**
   * For when the icon and the content differ in height: wraps each icon in a
   * box this tall and centers the icon in it.
   */
  fixedHeight?: string;
};

export const useIconAddon = ({
  leftAddOn,
  rightAddOn,
  leftIcon,
  rightIcon,
  loading,
  fixedHeight,
}: IconAddonProps) => {
  const iconSlot = (icon: ReactNode, key: string) => {
    return fixedHeight ? (
      fixedHeightIcon(icon, fixedHeight)
    ) : (
      <Slot key={key} className={'shrink-0'} data-slot="icon">
        {icon}
      </Slot>
    );
  };

  const leftContent = [
    loading && (leftIcon || !rightIcon)
      ? iconSlot(<LoadingIcon aria-hidden />, 'left-icon')
      : leftIcon
        ? iconSlot(leftIcon, 'left-icon')
        : null,
    !leftIcon && leftAddOn ? (
      <Slot key="left-add-on" data-slot="add-on">
        {leftAddOn}
      </Slot>
    ) : null,
  ].filter(Boolean);

  const rightContent = [
    !rightIcon && rightAddOn ? (
      <Slot key="right-add-on" data-slot="add-on">
        {rightAddOn}
      </Slot>
    ) : null,
    loading && rightIcon && !leftIcon
      ? iconSlot(<LoadingIcon aria-hidden />, 'right-icon')
      : rightIcon
        ? iconSlot(rightIcon, 'right-icon')
        : null,
  ].filter(Boolean);

  return {
    leftSlot: leftContent.length === 0 ? null : leftContent,
    rightSlot: rightContent.length === 0 ? null : rightContent,
  };
};
