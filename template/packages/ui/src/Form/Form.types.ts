import type { SectionHeaderProps, SectionProps } from '../Section';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type FormProps = ComponentPropsWithoutRef<'form'> &
  Pick<SectionProps, 'headingAs'> &
  Partial<Pick<SectionHeaderProps, 'title' | 'description'>> & {
    /** The form's own error, such as a failed save, shown above the actions. */
    error?: ReactNode;
    /** The buttons at the end: Cancel first, the main action last. */
    actions?: ReactNode;
    /** Every field takes the whole width: for a dialog or a narrow panel. */
    fill?: boolean;
  };

export type FormRowProps = ComponentPropsWithoutRef<'div'>;
