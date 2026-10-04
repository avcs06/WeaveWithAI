'use client';

import { classNames } from '@packages/styles/classNames';
import React, {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import { Tooltip } from '../Tooltip';

import { truncate } from './Truncate.css';

export type TruncateProps = ComponentPropsWithoutRef<'span'> & {
  /**
   * Shown above the full text when truncated, on its own otherwise. Hover
   * only: anything here must also be available elsewhere.
   */
  tooltip?: ReactNode;
  alwaysShowTooltip?: boolean;
};

/**
 * Whether the text is wider than the box. `scrollWidth` can't tell: with
 * `overflow-x: clip` the box isn't a scroll container, so it reports no
 * overflow. A range measures the text itself.
 */
const isTruncated = (element: HTMLElement) => {
  const range = document.createRange();
  // jsdom has no layout, and no range measuring either.
  if (typeof range.getBoundingClientRect !== 'function') return false;
  range.selectNodeContents(element);
  const style = getComputedStyle(element);
  const padding =
    (parseFloat(style.paddingLeft) || 0) +
    (parseFloat(style.paddingRight) || 0);
  const contentWidth = element.getBoundingClientRect().width - padding;
  return range.getBoundingClientRect().width > contentWidth + 0.01;
};

/** For a tooltip of your own, use `tooltip` rather than wrapping it in a `Tooltip`. */
export const Truncate = ({
  tooltip,
  alwaysShowTooltip = false,
  className,
  children,
  ...props
}: TruncateProps) => {
  // State, not a ref: the span is recreated when the tooltip wrapper comes or
  // goes, and the observer has to follow it.
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    if (!element) return;
    const check = () => setTruncated(isTruncated(element));
    const observer = new ResizeObserver(check);
    observer.observe(element);
    document.fonts?.addEventListener('loadingdone', check);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', check);
    };
  }, [element]);

  // New text can overflow without the element changing size.
  useEffect(() => {
    if (element) setTruncated(isTruncated(element));
  }, [element, children]);

  const showFullText = alwaysShowTooltip || truncated;

  return (
    <Tooltip tooltip={[tooltip, showFullText && children]} portal={false}>
      <span
        {...props}
        ref={setElement}
        className={classNames(truncate, 'block', className)}
      >
        {children}
      </span>
    </Tooltip>
  );
};
