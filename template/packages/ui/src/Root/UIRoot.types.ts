import type { ReactNode } from 'react';

export type UIProvidersProps = {
  /** How long the pointer rests on a trigger before its tooltip opens, in ms. */
  tooltipDelay?: number;
  children: ReactNode;
};

export type UIRootProps = {
  /** The page's language, read by screen readers and translators. */
  lang?: string;
  children: ReactNode;
};
