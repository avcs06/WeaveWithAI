import {
  type DependencyList,
  type EffectCallback,
  useEffect,
  useRef,
} from 'react';

import { didDepsChange } from './useDepsChanged';

/** `useEffect` that skips the run on mount. */
export const useOnChange = (effect: EffectCallback, deps: DependencyList) => {
  const depsDuringMountRef = useRef(deps);
  const depsChangedRef = useRef(false);

  useEffect(() => {
    // Compared by value, not with a "first run" flag: Strict Mode runs the
    // mount effect twice, and only a real change in deps should count.
    depsChangedRef.current ||= didDepsChange(depsDuringMountRef.current, deps);
    if (!depsChangedRef.current) return;
    return effect();
  }, deps);
};
