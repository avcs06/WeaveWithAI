'use client';

import { classNames } from '@packages/styles/classNames';
import React, {
  type ElementType,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type PointerEventHandler,
} from 'react';

import { Tooltip } from '../Tooltip';
import { createLook, hasContent, useIconAddon, useIsDisabled } from '../utils';

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

// What a disabled link drops: its `href`, and the props of Next.js's Link,
// which an anchor doesn't take.
const linkOnlyProps = [
  'href',
  'prefetch',
  'replace',
  'scroll',
  'shallow',
  'locale',
  'legacyBehavior',
  'passHref',
  'onNavigate',
];


const handleLinkButton = ({isDisabled, target, ...props}: Partial<ButtonBaseProps> & { isDisabled: boolean } ) => {
  
  // A disabled link can't be followed: an anchor without `href`, as Link
  // renders. A router link would still navigate, or demand its `href`.
  const isDisabledLink = isDisabled && props.href !== undefined;
  // Props were checked against the target at `Button`'s signature.
  const Element = (isDisabledLink ? 'a' : target) as ElementType;
  const elementProps = isDisabledLink
    ? Object.fromEntries(
        Object.entries(props).filter(([key]) => !linkOnlyProps.includes(key)),
      )
    : props;

  // Without `href`, assistive tech no longer reads an anchor as a link.
  const role = isDisabledLink ? 'link' : elementProps.role;

  return { Element, elementProps, role, isDisabledLink };
}

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
  const { isLoading, isDisabled, isFocusable, stateTooltip } = useIsDisabled({
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

  const { Element, elementProps, role, isDisabledLink } = handleLinkButton({
    isDisabled,
    target,
    ...props,
  });

  const repeatsName = [props['aria-label'], children].includes(tooltip);

  return (
    <>
      <Tooltip
        tooltip={[tooltip, stateTooltip]}
        description={[!repeatsName && tooltip, stateTooltip]}
      >
        <Element
          type={target === 'button' ? (type ?? 'button') : type}
          {...elementProps}
          role={role}
          aria-disabled={isDisabled || undefined}
          aria-busy={isLoading || undefined}
          data-disabled={isDisabled || undefined}
          tabIndex={
            isFocusable ? (tabIndex ?? (isDisabledLink ? 0 : undefined)) : -1
          }
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
      {/* `aria-busy` isn't announced. Kept on the page while empty, so a
          load that starts is. */}
      <span role="status" className="sr-only">
        {isLoading ? loadingWithReason || 'Loading…' : ''}
      </span>
    </>
  );
};

const buttonLook = createLook(buttonRecipe);

/**
 * An action the user takes: submit a form, save, publish, delete, open a
 * menu. `variant="default"` is the main action of a view, `base` a secondary
 * one, `danger` one that destroys. Navigation is a Link or NextLink, or a
 * Button `as` Next.js's Link where it must look like one; an icon alone is an
 * IconButton.
 *
 * @invalidAlternative button, input[type="button"], input[type="submit"], input[type="reset"], input[type="image"], a[role="button"], a[href="#"]
 */
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

/**
 * An action shown as an icon alone, where space is tight or the icon is
 * universal: settings, close, delete, more. Its `tooltip` shows the name and
 * is its accessible name; `aria-label` or `aria-labelledby` gives another.
 *
 * @invalidAlternative button[aria-label], button[aria-labelledby], Button[size="icon-xs"], Button[size="icon-sm"], Button[size="icon-md"]
 */
export const IconButton = <C extends ButtonTarget = 'button'>(
  props: IconButtonProps<C>,
) => {
  const { size = 'sm', children, ...buttonProps } = props;
  const tooltipName =
    props['aria-labelledby'] || typeof props.tooltip !== 'string'
      ? undefined
      : props.tooltip;

  return (
    <Button
      aria-label={tooltipName}
      {...buttonProps}
      size={`icon-${size}`}
      leftIcon={children}
    />
  );
};
