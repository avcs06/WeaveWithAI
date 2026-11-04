import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TruncateProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  // The text takes no focus; its tooltip follows the surrounding control's.
  'onFocus' | 'onBlur'
> & {
  /**
   * Shown above the full text when truncated, alone otherwise. Hover only: also
   * provide it elsewhere.
   */
  tooltip?: ReactNode;
  alwaysShowTooltip?: boolean;
};
