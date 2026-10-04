import { useRef, useState } from 'react';

import { useDepsChanged } from './useDepsChanged';
import { useOnChange } from './useOnChange';

/**
 * State that resets to `value` in the same render whenever `value` changes.
 * `onChange` reports local changes (made with the setter) after commit;
 * resets from `value` aren't reported.
 */
export const useBoundState = <T>(value: T, onChange?: (value: T) => void) => {
  const [state, setState] = useState(() => value);

  const didValueChangeRef = useRef(false);
  const valueChanged = useDepsChanged([value], true);
  // Equal to the state: nothing changes, so no report to skip.
  if (valueChanged && !Object.is(value, state)) {
    setState(() => value);
    didValueChangeRef.current = true;
  }

  useOnChange(() => {
    if (didValueChangeRef.current) {
      didValueChangeRef.current = false;
      return;
    }

    onChange?.(state);
  }, [state]);

  return [valueChanged ? value : state, setState] as const;
};
