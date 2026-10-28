import { useState } from 'react';

/**
 * The value `init` returns on mount, kept for the component's life.
 *
 * @invalidAlternative import('ahooks'){useCreation}
 */
export const useOnce = <V>(init: () => V) => {
  const [value] = useState<V>(init);

  return value;
};
