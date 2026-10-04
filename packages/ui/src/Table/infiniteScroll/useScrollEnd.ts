import { usePersistentCallback } from '@packages/utils/hooks';
import { useEffect, useRef } from 'react';

const END_THRESHOLD_PX = 200;

type UseScrollEndOptions = {
  enabled: boolean;
  onEnd: () => void;
  /**
   * Fires at most once per value. Pass `data`: a load that adds rows (or a new
   * query) replaces it, a failed load doesn't, so failures can't loop.
   */
  content: unknown;
};

/**
 * Calls `onEnd` when the viewport scrolls near its end, or isn't filled yet:
 * checked on scroll, on content changes, and when the viewport resizes.
 */
export const useScrollEnd = (
  viewport: HTMLElement | null,
  { enabled, onEnd, content }: UseScrollEndOptions,
) => {
  const firedForRef = useRef<unknown>(undefined);

  const check = usePersistentCallback(() => {
    if (!enabled || !viewport || firedForRef.current === content) return;

    const distanceToEnd =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    if (distanceToEnd > END_THRESHOLD_PX) return;

    firedForRef.current = content;
    onEnd();
  });

  useEffect(() => {
    if (!viewport) return;
    viewport.addEventListener('scroll', check, { passive: true });

    const resizeObserver = new ResizeObserver(check);
    resizeObserver.observe(viewport);
    return () => {
      viewport.removeEventListener('scroll', check);
      resizeObserver.disconnect();
    };
  }, [viewport, check]);

  // Rows that don't fill the viewport never scroll, so check after each change.
  useEffect(() => {
    check();
  }, [check, content, enabled]);
};
