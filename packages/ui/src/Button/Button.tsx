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

import { buttonRecipe } from './Button.recipes.css';

import type {
  ButtonProps,
  ButtonTarget,
  IconButtonProps,
  ButtonBaseProps,
} from './Button.types';

const activationKeys = ['Enter', ' '];

/**
 * While disabled, drops activation before any handler, including a Radix
 * trigger's via `asChild`.
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

// What a disabled link drops: `href` and Next.js Link's props, which an anchor
// rejects.
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

// The element apart from the props: a link's own `target` prop is one of them.
const handleLinkButton = (
  element: ElementType,
  isDisabled: boolean,
  props: Partial<ButtonBaseProps>,
) => {
  // An anchor without `href`, like Link; a router link would still navigate.
  const isDisabledLink = isDisabled && props.href !== undefined;
  const Element = isDisabledLink ? 'a' : element;
  const elementProps = isDisabledLink
    ? Object.fromEntries(
        Object.entries(props).filter(([key]) => !linkOnlyProps.includes(key)),
      )
    : props;

  // Without `href`, an anchor isn't read as a link.
  const role = isDisabledLink ? 'link' : elementProps.role;

  return { Element, elementProps, role, isDisabledLink };
};

/** A button's behavior and content without its look: the caller styles it. */
export const ButtonBase = ({
  as: element = 'button',
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

  const { Element, elementProps, role, isDisabledLink } = handleLinkButton(
    element as ElementType,
    isDisabled,
    props,
  );
  // Only a button that can load needs the region.
  const canLoad = loading !== undefined || loadingWithReason !== undefined;

  const repeatsName = [props['aria-label'], children].includes(tooltip);

  return (
    <>
      <Tooltip
        tooltip={[tooltip, stateTooltip]}
        description={[!repeatsName && tooltip, stateTooltip]}
      >
        <Element
          type={element === 'button' ? (type ?? 'button') : type}
          {...elementProps}
          role={role}
          aria-disabled={isDisabled || undefined}
          aria-busy={isLoading || undefined}
          data-disabled={isDisabled || undefined}
          tabIndex={
            isFocusable ? (tabIndex ?? (isDisabledLink ? 0 : undefined)) : -1
          }
          {...guardActivation(isDisabled, {
            onClick,
            onPointerDown,
            onKeyDown,
          })}
          className={classNames(
            'inline-flex-row-gap-0 items-center justify-center',
            className,
          )}
        >
          {leftSlot}
          {hasContent(children) && (
            <span className="flex-fill-x text-left">{children}</span>
          )}
          {rightSlot}
        </Element>
      </Tooltip>
      {/* `aria-busy` isn't announced; staying mounted while empty lets a new load be. */}
      {canLoad && (
        <span role="status" className="sr-only">
          {isLoading ? loadingWithReason || 'Loading…' : ''}
        </span>
      )}
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
