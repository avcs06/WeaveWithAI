import type { LinkOwnProps } from '@packages/ui/Link';

import type { LinkProps as NextJsLinkProps } from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

export type NextLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> &
  LinkOwnProps &
  Pick<
    NextJsLinkProps,
    'href' | 'replace' | 'scroll' | 'prefetch' | 'onNavigate'
  >;
