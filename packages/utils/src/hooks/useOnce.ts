import { useState } from 'react';

import type { Callable } from '../types';

export const useOnce = <T extends Callable>(callback: T) => {
  const [value] = useState(callback);

  return value as ReturnType<T>;
};
