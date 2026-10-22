'use client';

import NextJsLink from 'next/link';
import React from 'react';

import { Link } from '.';

import type { NextLinkProps } from './Link.types';

/** Link, navigating with Next.js's client-side routing. */
export const NextLink = ({
  href,
  replace,
  scroll,
  prefetch,
  children,
  ...props
}: NextLinkProps) => (
  <Link {...props} asChild>
    <NextJsLink
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
    >
      {children}
    </NextJsLink>
  </Link>
);
