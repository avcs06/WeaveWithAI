import { useBoundState } from '@packages/utils/hooks';
import { useLayoutEffect } from 'react';

import type { Constant } from '@packages/utils/types';

/**
 * A text field's shown text and its change handler. Without `delay`, the
 * field shows `value`, so a change the parent ignores isn't shown. With one,
 * the text shows at once and `onChange` waits for a pause in typing; `flush`
 * sends a waiting edit, and unmounting does too.
 */
export const useFieldText = <D extends number = never>(
  value: string,
  onChange: (value: string) => void,
  delay?: Constant<number, D>,
) => {
  const [text, setText, flush] = useBoundState(value, onChange, delay);
  const isDelayed = delay !== undefined;

  // A waiting edit is sent as the field goes, not dropped.
  useLayoutEffect(() => flush, [flush]);

  return {
    text: isDelayed ? text : value,
    setText: isDelayed ? setText : onChange,
    flush,
  };
};
