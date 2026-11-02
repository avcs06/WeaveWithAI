import type { ReactNode } from 'react';

export type ToolbarProps = {
  /** The room between the actions; the toolbar lays out nothing without it. */
  gap?: 'sm' | 'md';
  children?: ReactNode;
};

/**
 * A row of actions.
 * @invalidAlternative nav:has(Button)
 * @requiredProp gap
 */
export function Toolbar({ gap, children }: ToolbarProps) {
  return <nav data-gap={gap}>{children}</nav>;
}
