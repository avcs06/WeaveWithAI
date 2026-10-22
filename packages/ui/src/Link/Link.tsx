'use client';

import { classNames } from '@packages/styles/classNames';
import { Slot } from '@radix-ui/react-slot';
import React, { isValidElement } from 'react';

import { Tooltip } from '../Tooltip';

import { linkRecipe } from './Link.recipes.css';

import type { ChildProps, LinkProps } from './Link.types';

/**
 * Disabled, it's an anchor without `href`, so it can't be followed. With
 * `asChild`, the child's content moves into that anchor: the child can't
 * drop its own `href`.
 */
export const Link = ({
  variant,
  disabled = false,
  disabledWithReason,
  asChild = false,
  className,
  children,
  ...props
}: LinkProps) => {
  const isDisabled = disabled || Boolean(disabledWithReason);
  const linkClassName = linkRecipe({ variant });

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
          // Without `href`, assistive tech no longer reads an anchor as a link.
          role="link"
          aria-disabled
          data-disabled
          tabIndex={-1}
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
