import type { IconAddonProps } from '../utils';
import type { ComponentProps, ReactNode } from 'react';

export type SectionHeaderProps = Pick<
  IconAddonProps,
  'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'
> & {
  /** The heading's text; its level comes from how deep the section sits. */
  title: ReactNode;
  /** A muted line under the heading that says what the section holds. */
  description?: ReactNode;
  /** Controls at the header's end, like a Create button. */
  headerAction?: ReactNode;
};

export type SectionProps = Omit<ComponentProps<'section'>, 'title'> &
  SectionHeaderProps & {
    /** The heading's id, for a control it names with `aria-labelledby`. */
    titleId?: string;
    /**
     * The heading element, over the one nesting picks: `h1` for the page's
     * own title. Sections inside follow from it; the size stays the same.
     */
    headingAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  };
