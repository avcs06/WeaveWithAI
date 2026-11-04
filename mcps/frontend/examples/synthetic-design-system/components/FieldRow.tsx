import type { ReactNode } from 'react';

/**
 * Fields side by side inside a form.
 * @invalidAlternative Form div:has(TextField)
 */
export function FieldRow({ children }: { children?: ReactNode }) {
  return <div data-row="">{children}</div>;
}
