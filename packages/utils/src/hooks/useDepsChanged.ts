import { type DependencyList, useRef } from 'react';

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

export const useDepsChanged = (
  dependencies: DependencyList,
  trailing = false,
) => {
  const dependenciesRef = useRef<DependencyList>(trailing ? dependencies : []);
  const didChange = didDepsChange(dependenciesRef.current, dependencies);
  dependenciesRef.current = dependencies;
  return didChange;
};
