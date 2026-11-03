import { classNames } from '@packages/styles/classNames';
import { Quote as QuoteMark } from 'lucide-react';
import React from 'react';

import * as styles from './Typography.css';

import type {
  CaptionProps,
  CodeBlockProps,
  CodeProps,
  DescriptionDetailsProps,
  DescriptionListProps,
  DescriptionTermProps,
  ListItemProps,
  ListProps,
  ParagraphProps,
  QuoteProps,
} from './Typography.types';

/**
 * A paragraph of body text. Font and color can change; size and line height
 * stay the body's.
 */
export const Paragraph = ({
  font,
  color,
  className,
  ...props
}: ParagraphProps) => (
  <p
    {...props}
    data-ds=""
    className={classNames(
      styles.paragraph,
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * A small line about the text beside it: a date under a title, a note under
 * a figure, a count beside a heading. Muted unless `color` says otherwise;
 * size and line height stay the caption's.
 */
export const Caption = ({
  font,
  color = 'muted',
  className,
  ...props
}: CaptionProps) => (
  <p
    {...props}
    data-ds=""
    className={classNames(
      styles.caption,
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * A bulleted list of text, or numbered with `ordered`. Each item is a
 * `ListItem`; an item may hold a list of its own.
 *
 * @invalidAlternative ol
 */
export const List = ({
  ordered = false,
  font,
  color,
  className,
  ...props
}: ListProps) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag
      {...props}
      data-ds=""
      className={classNames(
        styles.list,
        ordered ? styles.numbered : styles.bulleted,
        font && styles.fonts[font],
        color && styles.textColors[color],
        className,
      )}
    />
  );
};

/**
 * One item of a `List`.
 *
 * @invalidAlternative List li
 */
export const ListItem = ({
  font,
  color,
  className,
  ...props
}: ListItemProps) => (
  <li
    {...props}
    data-ds=""
    className={classNames(
      styles.listItem,
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * A record's fields as label and value pairs: a `DescriptionTerm` and its
 * `DescriptionDetails` side by side, one pair a row. A `div` around a pair
 * keeps it in its row.
 *
 * @invalidAlternative dl
 */
export const DescriptionList = ({
  font,
  color,
  className,
  ...props
}: DescriptionListProps) => (
  <dl
    {...props}
    data-ds=""
    className={classNames(
      styles.descriptionList,
      'grid',
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * A field's label in a `DescriptionList`: muted unless `color` says otherwise.
 *
 * @invalidAlternative dt
 */
export const DescriptionTerm = ({
  font,
  color = 'muted',
  className,
  ...props
}: DescriptionTermProps) => (
  <dt
    {...props}
    data-ds=""
    className={classNames(
      styles.descriptionTerm,
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * A field's value in a `DescriptionList`, beside its term.
 *
 * @invalidAlternative dd
 */
export const DescriptionDetails = ({
  font,
  color,
  className,
  ...props
}: DescriptionDetailsProps) => (
  <dd
    {...props}
    data-ds=""
    className={classNames(
      styles.descriptionDetails,
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * A quotation between quote marks on a box in the theme's color, with its
 * `source` under it in the box when given.
 *
 * @invalidAlternative blockquote
 */
export const Quote = ({
  source,
  font,
  color,
  className,
  children,
  ...props
}: QuoteProps) => {
  const box = classNames('relative', styles.quoteBox);
  const quote = (
    <blockquote
      {...props}
      data-ds=""
      className={classNames(
        source === undefined ? box : styles.quote,
        font && styles.fonts[font],
        color && styles.textColors[color],
        source === undefined && className,
      )}
    >
      <QuoteMark
        aria-hidden
        fill="currentColor"
        className={classNames('absolute', styles.openMark)}
      />
      {children}
      <QuoteMark
        aria-hidden
        fill="currentColor"
        className={classNames('absolute', styles.closeMark)}
      />
    </blockquote>
  );
  if (source === undefined) return quote;
  return (
    <figure data-ds="" className={classNames(box, className)}>
      {quote}
      <figcaption data-ds="" className={styles.quoteSource}>
        {source}
      </figcaption>
    </figure>
  );
};

/**
 * Code inside a sentence: a name, a command, a value as typed. In the mono
 * font at the size of the text around it.
 *
 * @invalidAlternative code
 */
export const Code = ({ color, className, ...props }: CodeProps) => (
  <code
    {...props}
    data-ds=""
    className={classNames(
      styles.code,
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * Lines of code on their own, as written: spaces and line breaks stay. A
 * long line scrolls sideways inside it, and it takes keyboard focus to.
 *
 * @invalidAlternative pre
 */
export const CodeBlock = ({
  children,
  color,
  className,
  ...props
}: CodeBlockProps) => (
  <pre
    // Focusable, so a keyboard can scroll a long line into view.
    tabIndex={0}
    {...props}
    data-ds=""
    className={classNames(
      styles.codeBlock,
      color && styles.textColors[color],
      className,
    )}
  >
    <code>{children}</code>
  </pre>
);
