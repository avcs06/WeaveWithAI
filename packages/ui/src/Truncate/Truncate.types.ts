import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TruncateProps = ComponentPropsWithoutRef<'span'> & {
  /**
   * Shown above the full text when truncated, on its own otherwise. Hover
   * only: anything here must also be available elsewhere.
   */
  tooltip?: ReactNode;
  alwaysShowTooltip?: boolean;
};
