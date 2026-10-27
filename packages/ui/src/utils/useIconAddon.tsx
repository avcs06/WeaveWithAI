import { Slot } from '@radix-ui/react-slot';
import React, { isValidElement, type ReactNode } from 'react';

import { LoadingIcon } from '../Icons';

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
    // Decoration: the control's text or `aria-label` names it.
    const slot = (
      <Slot key={key} className="shrink-0" data-slot="icon" aria-hidden>
        {icon}
      </Slot>
    );
    if (!fixedHeight) return slot;

    return (
      <div
        key={key}
        data-slot="icon-box"
        className="inline-flex justify-center items-center"
        style={{ height: fixedHeight }}
      >
        {slot}
      </div>
    );
  };

  // Slot takes one element; text, like "https://", gets a span.
  const addOnSlot = (addOn: ReactNode, key: string) =>
    isValidElement(addOn) ? (
      <Slot key={key} data-slot="add-on">
        {addOn}
      </Slot>
    ) : (
      <span key={key} data-slot="add-on">
        {addOn}
      </span>
    );

  const leftContent = [
    loading && (leftIcon || !rightIcon)
      ? iconSlot(<LoadingIcon />, 'left-icon')
      : leftIcon
        ? iconSlot(leftIcon, 'left-icon')
        : null,
    !leftIcon && leftAddOn ? addOnSlot(leftAddOn, 'left-add-on') : null,
  ].filter(Boolean);

  const rightContent = [
    !rightIcon && rightAddOn ? addOnSlot(rightAddOn, 'right-add-on') : null,
    loading && rightIcon && !leftIcon
      ? iconSlot(<LoadingIcon />, 'right-icon')
      : rightIcon
        ? iconSlot(rightIcon, 'right-icon')
        : null,
  ].filter(Boolean);

  return {
    leftSlot: leftContent.length === 0 ? null : leftContent,
    rightSlot: rightContent.length === 0 ? null : rightContent,
  };
};
