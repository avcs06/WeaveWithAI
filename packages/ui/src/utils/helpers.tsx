import type { ReactNode, Ref, RefCallback } from 'react';

/** Whether React draws anything for `node`. */
export const hasContent = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

/** An id list for `aria-describedby` and the like; `undefined` when empty. */
export const joinIds = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(' ') || undefined;

const setRef = <T,>(ref: Ref<T> | undefined, node: T | null) => {
  if (typeof ref === 'function') return ref(node);
  if (ref) ref.current = node;
};

/**
 * One callback ref that sets each of `refs`. A callback ref that returns a
 * cleanup gets its cleanup on detach, the others `null`, as React does.
 */
export const mergeRefs =
  <T,>(...refs: (Ref<T> | undefined)[]): RefCallback<T> =>
  (node) => {
    const cleanups = refs.map((ref) => setRef(ref, node));
    return () =>
      cleanups.forEach((cleanup, index) =>
        cleanup ? cleanup() : setRef(refs[index], null),
      );
  };
