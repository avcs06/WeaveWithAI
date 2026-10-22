'use client';

import { type ReactNode, useEffect, useState } from 'react';

import { truncate } from './Truncate.css';

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

/**
 * Cuts an element's text to one line and tells whether it's cut. Put `ref`
 * and `className` on the element that holds the text.
 */
export const useTruncation = <T extends HTMLElement>(content: ReactNode) => {
  // State, not a ref: the element is recreated when a tooltip wrapper comes
  // or goes, and the observer has to follow it.
  const [element, setElement] = useState<T | null>(null);
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
  }, [element, content]);

  return { ref: setElement, className: truncate, truncated };
};
