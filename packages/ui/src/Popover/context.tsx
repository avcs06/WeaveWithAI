import { createContext } from '@packages/utils/state';

import type { PopoverStateProps } from './Popover.types';

/** The Popover's state, for its trigger button to show with its reason. */
export const [PopoverProvider, usePopover] = createContext<PopoverStateProps>({
  disabled: undefined,
  disabledWithReason: undefined,
  loading: undefined,
  loadingWithReason: undefined,
  disableWhileLoading: undefined,
});
