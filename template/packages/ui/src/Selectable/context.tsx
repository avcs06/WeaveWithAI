import { createContext } from '@packages/utils/state';

import type { SelectableGroupContextValue } from './Selectable.types';

export const [SelectableGroupProvider, useSelectableGroup] =
  createContext<SelectableGroupContextValue>({
    mode: undefined,
    values: undefined,
    name: undefined,
    disabled: undefined,
    disabledWithReason: undefined,
    readOnly: undefined,
    readOnlyWithReason: undefined,
    onToggle: undefined,
  });
