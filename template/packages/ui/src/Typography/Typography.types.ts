import type { SetByComponent } from '../utils';
import type { ComponentPropsWithoutRef, JSX, ReactNode } from 'react';

/** One of the theme's three fonts. */
export type TextFont = 'ui' | 'display' | 'mono';

/** The page's text colors, and the brand's and each status's text color on the page. */
export type TextColor =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

/** What every text element can change; its size and line height stay its own. */
export type TextStyleProps = {
  /** Over the font it inherits, or mono for code. */
  font?: TextFont;
  /** Over the color it inherits, or muted for a description term. */
  color?: TextColor;
};

type Element<T extends keyof JSX.IntrinsicElements> = Omit<
  ComponentPropsWithoutRef<T>,
  'color'
> &
  TextStyleProps;

export type ParagraphProps = Element<'p'>;

export type CaptionProps = Element<'p'>;

export type ListProps = Omit<Element<'ul'>, 'type'> & {
  /** Numbered (`ol`) instead of bulleted (`ul`): for steps or a ranking, where the order means something. */
  ordered?: boolean;
};

export type ListItemProps = Element<'li'>;

export type DescriptionListProps = Element<'dl'>;

export type DescriptionTermProps = Element<'dt'>;

export type DescriptionDetailsProps = Element<'dd'>;

export type QuoteProps = Element<'blockquote'> & {
  /** Who said it or where it comes from, shown under the quote. */
  source?: ReactNode;
};

/** Always in the mono font: code has no other. */
export type CodeProps = Omit<Element<'code'>, 'font'>;

/** Always in the mono font, like Code. */
export type CodeBlockProps = Omit<Element<'pre'>, 'children' | 'font'> & {
  /** The code as text; its lines and spaces stay as written. */
  children: string;
};

export type KbdProps = Element<'kbd'>;

export type MarkProps = Element<'mark'>;

export type SeparatorProps = Omit<ComponentPropsWithoutRef<'hr'>, 'color'> &
  // Set from `orientation`.
  SetByComponent<'aria-orientation'> & {
    /** Vertical between items in a row, where it stretches to the row's height. */
    orientation?: 'horizontal' | 'vertical';
  };

export type TimeProps = Omit<Element<'time'>, 'dateTime' | 'children'> & {
  /** ISO 8601: a day, `2026-11-07`, or a moment, `2026-11-07T18:30:00.000Z`. */
  value: string;
  /** The time of day after a moment's date; a day has none to show. */
  withTime?: boolean;
};
