import { classNames } from '@packages/styles/classNames';
import React from 'react';

import * as styles from './Typography.css';

import type {
  KbdProps,
  MarkProps,
  SeparatorProps,
  TimeProps,
} from './Typography.types';

/**
 * A key or a shortcut the user presses, such as Ctrl K, inside a sentence. In
 * the mono font at the size of the text around it, on a box with a border.
 *
 * @invalidAlternative kbd
 */
export const Kbd = ({
  font = 'mono',
  color,
  className,
  ...props
}: KbdProps) => (
  <kbd
    {...props}
    data-ds=""
    className={classNames(
      styles.kbd,
      font && styles.fonts[font],
      color && styles.textColors[color],
      className,
    )}
  />
);

/**
 * Text that matches what the user searched for, or that the text points out,
 * on a box in the theme's color. It keeps the color of the text around it
 * unless `color` says otherwise.
 *
 * @invalidAlternative mark
 */
export const Mark = ({ font, color, className, ...props }: MarkProps) => (
  <mark
    {...props}
    data-ds=""
    className={classNames(
      styles.highlight,
      font && styles.fonts[font],
      color ? styles.textColors[color] : styles.inheritColor,
      className,
    )}
  />
);

/**
 * A line between two groups of content that need one, across their column;
 * `vertical` between items in a row, as tall as the row. It has no margins:
 * the parent's gap spaces it.
 *
 * @invalidAlternative hr
 * @invalidAlternative [role="separator"]
 */
export const Separator = ({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) => {
  const vertical = orientation === 'vertical';
  return (
    <hr
      {...props}
      data-ds=""
      aria-orientation={vertical ? 'vertical' : undefined}
      className={classNames(
        styles.separator,
        vertical ? styles.vertical : styles.horizontal,
        // Across a column even when it starts its items; `h-auto` over the
        // reset's 0 height, or a row can't stretch it.
        'self-stretch',
        vertical && 'h-auto',
        className,
      )}
    />
  );
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const date = { day: 'numeric', month: 'short', year: 'numeric' } as const;
// The app's one format: "7 Nov 2026", and "7 Nov 2026, 18:30" with the time.
// A day is a calendar date, the same in every time zone.
const dayFormat = new Intl.DateTimeFormat('en-GB', {
  ...date,
  timeZone: 'UTC',
});
const dateFormat = new Intl.DateTimeFormat('en-GB', date);
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  ...date,
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * A date or a moment in the app's one format: "7 Nov 2026", or with
 * `withTime` "7 Nov 2026, 18:30". A day reads the same everywhere; a moment
 * shows in the viewer's time zone. A value that isn't ISO 8601 shows as given.
 *
 * @invalidAlternative time
 */
export const Time = ({
  value,
  withTime = false,
  font,
  color,
  className,
  ...props
}: TimeProps) => {
  const day = DAY.test(value);
  const moment = new Date(day ? `${value}T00:00:00Z` : value);
  const format = day ? dayFormat : withTime ? dateTimeFormat : dateFormat;
  return (
    <time
      {...props}
      dateTime={value}
      data-ds=""
      // A moment's text follows the viewer's time zone, which the server can't know.
      suppressHydrationWarning={!day}
      className={classNames(
        font && styles.fonts[font],
        color && styles.textColors[color],
        className,
      )}
    >
      {Number.isNaN(moment.getTime()) ? value : format.format(moment)}
    </time>
  );
};
