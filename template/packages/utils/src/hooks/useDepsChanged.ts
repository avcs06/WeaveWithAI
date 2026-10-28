import { type DependencyList, useState } from 'react';

export const didDepsChange = (
  prevDeps: DependencyList,
  nextDeps: DependencyList,
) => {
  return (
    prevDeps.length !== nextDeps.length ||
    prevDeps.some(
      (dependency, index) => !Object.is(dependency, nextDeps[index]),
    )
  );
};

/**
 * Whether `dependencies` changed since the last render (`Object.is`). The
 * first render counts; with `trailing`, only changes after mount do.
 */
export const useDepsChanged = (
  dependencies: DependencyList,
  trailing = false,
) => {
  // State, not a ref: a discarded render keeps the previous deps, so the
  // retry sees the change again.
  const [prevDeps, setPrevDeps] = useState<DependencyList | null>(
    trailing ? dependencies : null,
  );
  const didChange = prevDeps === null || didDepsChange(prevDeps, dependencies);
  if (didChange) setPrevDeps(dependencies);
  return didChange;
};
