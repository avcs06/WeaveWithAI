'use client';

import { useEffect, useRef, useState } from 'react';

import { truncate } from './Truncate.css';

type Measure = (width: number) => void;

// One observer and one font listener serve every instance, since a table
// holds a Truncate in each cell. Created on first use: servers have neither.
const measures = new WeakMap<Element, Measure>();
const fontListeners = new Set<() => void>();
let observer: ResizeObserver | undefined;

const subscribe = (element: Element, measure: Measure, onFonts: () => void) => {
  observer ??= new ResizeObserver((entries) =>
    entries.forEach((entry) =>
      measures.get(entry.target)?.(entry.contentRect.width),
    ),
  );
  if (fontListeners.size === 0)
    document.fonts?.addEventListener('loadingdone', runFontListeners);

  measures.set(element, measure);
  fontListeners.add(onFonts);
  observer.observe(element);

  return () => {
    observer?.unobserve(element);
    measures.delete(element);
    fontListeners.delete(onFonts);
    if (fontListeners.size === 0)
      document.fonts?.removeEventListener('loadingdone', runFontListeners);
  };
};

const runFontListeners = () => fontListeners.forEach((listener) => listener());

/**
 * The text's own width against the box's content width. `scrollWidth` can't
 * tell: with `overflow-x: clip` the box isn't a scroll container, so it
 * reports no overflow.
 */
const rangeWidth = (element: HTMLElement) => {
  const range = document.createRange();
  // jsdom has no layout, and no range measuring either.
  if (typeof range.getBoundingClientRect !== 'function') return 0;
  range.selectNodeContents(element);
  return range.getBoundingClientRect().width;
};

/**
 * Cuts an element's text to one line and tells whether it's cut. Put `ref`
 * and `className` on the element that holds the text. A cut text is only in
 * the element, so show it in a tooltip: `tooltip={truncated && text}`.
 */
export const useTruncation = <T extends HTMLElement>(
  /** @deprecated Ignored: text changes are observed. */
  _content?: unknown,
) => {
  const ref = useRef<T>(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Unknown until the observer reports the first size.
    let contentWidth: number | undefined;
    const check = () => {
      if (contentWidth !== undefined)
        setTruncated(rangeWidth(element) > contentWidth + 0.01);
    };

    const unsubscribe = subscribe(
      element,
      (width) => {
        contentWidth = width;
        check();
      },
      check,
    );

    // New text can overflow without the element changing size.
    const mutations = new MutationObserver(check);
    mutations.observe(element, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      unsubscribe();
      mutations.disconnect();
    };
  }, []);

  return { ref, className: truncate, truncated };
};
