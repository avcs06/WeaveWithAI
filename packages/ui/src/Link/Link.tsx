'use client';

import { classNames } from '@packages/styles/classNames';
import { Slot } from '@radix-ui/react-slot';
import React, { isValidElement } from 'react';

import { Tooltip } from '../Tooltip';
import { createLook } from '../utils';

import { linkRecipe } from './Link.recipes.css';

import type { ChildProps, LinkProps } from './Link.types';

const linkLook = createLook(linkRecipe);

/**
 * Text that takes the user to another page: another site, an email
 * (`mailto:`), a phone number (`tel:`) or a file to download. In the Next
 * app, a route of the app is the app's NextLink, built on Link; an action is
 * a Button.
 *
 * @invalidAlternative a[href], a[download], [role="link"]
 */
export const Link = ({
  variant,
  look,
  disabled = false,
  disabledWithReason,
  asChild = false,
  className,
  children,
  ...props
}: LinkProps) => {
  const isDisabled = disabled || Boolean(disabledWithReason);
  const linkClassName = linkRecipe({ variant, ...linkLook(look) });

  // Disabled, an anchor without `href`. With `asChild`, the child's content
  // moves into that anchor, since the child can't drop its own `href`.
  if (isDisabled) {
    const child = asChild && isValidElement<ChildProps>(children) && children;
    const childClassName = child && child.props.className;
    const {
      href: _href,
      tabIndex: _tabIndex,
      onClick: _onClick,
      ...anchorProps
    } = props;

    return (
      <Tooltip tooltip={disabledWithReason}>
        <a
          {...anchorProps}
          // Without `href`, an anchor isn't read as a link.
          role="link"
          aria-disabled
          data-disabled
          // A reason must be keyboard-reachable; without one it leaves the tab
          // order.
          tabIndex={disabledWithReason ? 0 : -1}
          onClick={(event) => event.preventDefault()}
          className={classNames(linkClassName, childClassName, className)}
        >
          {child ? child.props.children : children}
        </a>
      </Tooltip>
    );
  }

  const Anchor = asChild ? Slot : 'a';
  return (
    <Anchor {...props} className={classNames(linkClassName, className)}>
      {children}
    </Anchor>
  );
};
