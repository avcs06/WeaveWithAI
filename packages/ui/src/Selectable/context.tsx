import { createContext } from '@packages/utils/state';

import type { SelectableGroupContextValue } from './Selectable.types';

export const [SelectableGroupProvider, useSelectableGroup] =
  createContext<SelectableGroupContextValue>({
    mode: undefined,
    values: undefined,
    disabled: undefined,
    onToggle: undefined,
  });
