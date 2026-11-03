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

/** What every text element can change; its size and line height stay the body's. */
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

export type CodeProps = Element<'code'>;

export type CodeBlockProps = Omit<Element<'pre'>, 'children'> & {
  /** The code as text; its lines and spaces stay as written. */
  children: string;
};
