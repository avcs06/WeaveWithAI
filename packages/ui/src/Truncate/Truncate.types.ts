import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TruncateProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  // The text never takes focus; its tooltip follows the focus of the control
  // around it.
  'onFocus' | 'onBlur'
> & {
  /**
   * Shown above the full text when truncated, on its own otherwise. Hover
   * only: anything here must also be available elsewhere.
   */
  tooltip?: ReactNode;
  alwaysShowTooltip?: boolean;
};
