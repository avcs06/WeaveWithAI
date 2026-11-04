import type { ReactNode } from 'react';

export type HeroProps = {
  /** The landing page's headline, its only H1. */
  title: ReactNode;
  /** The line under the headline. */
  description?: ReactNode;
  /** The main action and the way to sign in, such as two Buttons. */
  actions?: ReactNode;
  /** Beside the text, such as the preview of the app at work; without it, the text takes the width. */
  media?: ReactNode;
  /** A background of the page's own, such as the brief's signature, from a colocated `.css.ts`; the brand's gradient otherwise. */
  className?: string;
};
