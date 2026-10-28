'use client';

import { classNames } from '@packages/styles/classNames';
import { useEffect, useRef, useState } from 'react';

// Sideways only: clipping both ways cuts descenders at tight line heights.
// `clip`, unlike `hidden`, keeps the other axis from becoming a scroll
// container.
const truncate = classNames(
  'min-w-0 whitespace-nowrap text-ellipsis',
  'overflow-x-clip overflow-y-visible',
);

type Measure = (width: number) => void;

// One observer of each kind and one font listener serve every instance (a
// table has one per cell); created lazily, as servers have none.
const measures = new WeakMap<Element, Measure>();
const checks = new Map<Element, () => void>();
let resizes: ResizeObserver | undefined;
let mutations: MutationObserver | undefined;

const runChecks = () => checks.forEach((check) => check());

// A MutationObserver can't drop one element: a record finds its instance by
// walking up, and one that's gone finds none.
const checkMutated = (records: MutationRecord[]) => {
  const mutated = new Set<() => void>();
  for (const { target } of records) {
    let node: Node | null = target;
    while (node && !checks.has(node as Element)) node = node.parentNode;
    const check = node && checks.get(node as Element);
    if (check) mutated.add(check);
  }
  mutated.forEach((check) => check());
};

const subscribe = (element: Element, measure: Measure, check: () => void) => {
  resizes ??= new ResizeObserver((entries) =>
    entries.forEach((entry) =>
      measures.get(entry.target)?.(entry.contentRect.width),
    ),
  );
  mutations ??= new MutationObserver(checkMutated);
  if (checks.size === 0)
    document.fonts?.addEventListener('loadingdone', runChecks);

  measures.set(element, measure);
  checks.set(element, check);
  resizes.observe(element);
  // New text can overflow without the element changing size.
  mutations.observe(element, {
    characterData: true,
    childList: true,
    subtree: true,
  });

  return () => {
    resizes?.unobserve(element);
    measures.delete(element);
    checks.delete(element);
    if (checks.size > 0) return;
    document.fonts?.removeEventListener('loadingdone', runChecks);
    mutations?.disconnect();
    mutations = undefined;
  };
};

/**
 * The text's width against the box's content width; `scrollWidth` reports no
 * overflow under `overflow-x: clip`.
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
export const useTruncation = <T extends HTMLElement>() => {
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

    return subscribe(
      element,
      (width) => {
        contentWidth = width;
        check();
      },
      check,
    );
  }, []);

  return { ref, className: truncate, truncated };
};
