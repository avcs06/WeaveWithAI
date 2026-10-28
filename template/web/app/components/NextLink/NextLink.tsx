'use client';

import { Link } from '@packages/ui/Link';
import NextJsLink from 'next/link';
import React from 'react';

import type { NextLinkProps } from './NextLink.types';

/**
 * A link to a route of this app, like `/events/42`: Next.js navigates to it
 * without reloading the page, and prefetches it. It looks like Link, which
 * is for other sites, emails and files.
 *
 * @invalidAlternative import('next/link')
 */
export const NextLink = ({
  href,
  replace,
  scroll,
  prefetch,
  onNavigate,
  children,
  ...props
}: NextLinkProps) => (
  <Link {...props} asChild>
    <NextJsLink
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
      onNavigate={onNavigate}
    >
      {children}
    </NextJsLink>
  </Link>
);
