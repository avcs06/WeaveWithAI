'use client';

import { classNames } from '@packages/styles/classNames';
import React, {
  type ElementType,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
  type ReactNode,
} from 'react';

import { Tooltip } from '../Tooltip';
import { createLook, useIconAddon, useIsDisabled } from '../utils';

import { buttonLabel } from './Button.css';
import { buttonRecipe } from './Button.recipes.css';

import type {
  ButtonProps,
  ButtonTarget,
  IconButtonProps,
  ButtonBaseProps,
} from './Button.types';

const activationKeys = ['Enter', ' '];

/**
 * While disabled, swallows activation before any handler runs: the caller's,
 * or a Radix trigger's passed in through `asChild`. Other events pass through.
 */
export const guardActivation = (
  isDisabled: boolean,
  { onClick, onPointerDown, onKeyDown }: Partial<ButtonBaseProps>,
) => ({
  onClick: ((event) => {
    if (isDisabled) event.preventDefault();
    else onClick?.(event);
  }) satisfies MouseEventHandler<HTMLElement>,
  onPointerDown: ((event) => {
    if (!isDisabled) onPointerDown?.(event);
  }) satisfies PointerEventHandler<HTMLElement>,
  onKeyDown: ((event) => {
    if (isDisabled && activationKeys.includes(event.key))
      event.preventDefault();
    else onKeyDown?.(event);
  }) satisfies KeyboardEventHandler<HTMLElement>,
});

const hasContent = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

/** A button's behavior and content without its look: the caller styles it. */
export const ButtonBase = ({
  as: target = 'button',
  leftIcon,
  rightIcon,
  leftAddOn,
  rightAddOn,
  tooltip,
  disabled,
  disabledWithReason,
  readOnly,
  readOnlyWithReason,
  loading,
  loadingWithReason,
  disableWhileLoading,
  type,
  tabIndex,
  onClick,
  onPointerDown,
  onKeyDown,
  className,
  children,
  ...props
}: ButtonBaseProps) => {
  const { isLoading, isDisabled, stateTooltip } = useIsDisabled({
    disabled,
    disabledWithReason,
    readOnly,
    readOnlyWithReason,
    loading,
    loadingWithReason,
    disableWhileLoading,
  });

  const { leftSlot, rightSlot } = useIconAddon({
    leftIcon,
    rightIcon,
    leftAddOn,
    rightAddOn,
    loading: isLoading,
  });

  // Props were checked against the target at `Button`'s signature.
  const Element = target as ElementType;
  // A component target handles its own disabled state, like dropping its
  // `href`. A native `disabled` would block the tooltip.
  const isComponent = target !== 'button';

  return (
    <Tooltip tooltip={[tooltip, stateTooltip]}>
      <Element
        type={target === 'button' ? (type ?? 'button') : type}
        {...props}
        disabled={(isComponent && isDisabled) || undefined}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        data-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : tabIndex}
        {...guardActivation(isDisabled, { onClick, onPointerDown, onKeyDown })}
        className={classNames(
          'inline-flex-row-gap-0 items-center justify-center',
          className,
        )}
      >
        {leftSlot}
        {hasContent(children) && (
          <span className={classNames(buttonLabel, 'flex-fill-x')}>
            {children}
          </span>
        )}
        {rightSlot}
      </Element>
    </Tooltip>
  );
};

const buttonLook = createLook(buttonRecipe);

export const Button = <C extends ButtonTarget = 'button'>({
  variant,
  size,
  look,
  className,
  ...props
}: ButtonProps<C>) => {
  const buttonClassName = buttonRecipe({ variant, size, ...buttonLook(look) });
  return (
    <ButtonBase {...props} className={classNames(buttonClassName, className)} />
  );
};

export const IconButton = <C extends ButtonTarget = 'button'>(
  props: IconButtonProps<C>,
) => {
  const { size = 'sm', children, ...buttonProps } = props;
  return <Button {...buttonProps} size={`icon-${size}`} leftIcon={children} />;
};
