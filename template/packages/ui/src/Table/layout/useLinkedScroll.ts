import { useEffect } from 'react';

/**
 * Syncs the header's horizontal scroll with the body. The header is
 * overflow-hidden, so wheel input on it goes to the body, and focus scrolling
 * inside it (tabbing to an offscreen header) is mirrored back. Takes elements,
 * not refs, to re-bind when either is replaced.
 */
export const useLinkedScroll = (
  header: HTMLElement | null,
  body: HTMLElement | null,
) => {
  useEffect(() => {
    if (!header || !body) return;

    const syncHeader = () => {
      if (header.scrollLeft !== body.scrollLeft)
        header.scrollLeft = body.scrollLeft;
    };
    const syncBody = () => {
      if (body.scrollLeft !== header.scrollLeft)
        body.scrollLeft = header.scrollLeft;
    };
    const forwardWheel = (event: WheelEvent) => {
      const deltaX = event.deltaX || (event.shiftKey ? event.deltaY : 0);
      if (deltaX) body.scrollLeft += deltaX;
    };

    syncHeader();
    body.addEventListener('scroll', syncHeader, { passive: true });
    header.addEventListener('scroll', syncBody, { passive: true });
    header.addEventListener('wheel', forwardWheel, { passive: true });
    return () => {
      body.removeEventListener('scroll', syncHeader);
      header.removeEventListener('scroll', syncBody);
      header.removeEventListener('wheel', forwardWheel);
    };
  }, [header, body]);
};
