import { createContext } from '@packages/utils/state';

import type { RefObject } from 'react';

type DropdownContextValue = {
  /** The text field keys type into instead of moving through the items. */
  searchRef: RefObject<HTMLElement | null> | undefined;
  contentRef: RefObject<HTMLDivElement | null> | undefined;
  isLoading: boolean;
  isDisabled: boolean;
  stateTooltip: string;
  close: () => void;
  closeOnTab: boolean;
  showCheckbox: boolean;
  showCheckmark: boolean;
};

export const [DropdownProvider, useDropdown] =
  createContext<DropdownContextValue>({
    searchRef: undefined,
    contentRef: undefined,
    isLoading: false,
    isDisabled: false,
    stateTooltip: '',
    close: () => undefined,
    closeOnTab: false,
    showCheckbox: false,
    showCheckmark: true,
  });

/** The value of the RadioGroup around a RadioItem. */
export const [RadioGroupProvider, useRadioGroup] = createContext<{
  checkedValue: string | undefined;
}>({ checkedValue: undefined });
