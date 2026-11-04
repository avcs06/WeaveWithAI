import { useEffect, useRef, useState } from 'react';

/**
 * Whether `src` failed to load. It can fail before hydration, missing React's
 * error event, so a settled image is checked: `decode()` rejects when broken.
 */
export const useImageFailed = (src: string | undefined) => {
  const ref = useRef<HTMLImageElement>(null);
  const [failedSrc, setFailedSrc] = useState<string>();

  useEffect(() => {
    const image = ref.current;
    // jsdom has no `decode`.
    if (image?.complete) image.decode?.().catch(() => setFailedSrc(src));
  }, [src]);

  return {
    ref,
    failed: src !== undefined && failedSrc === src,
    onError: () => setFailedSrc(src),
  };
};
