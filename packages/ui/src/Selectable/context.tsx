import { createContext } from '@packages/utils/state';

export type SelectableGroupContextValue = {
  mode?: 'single' | 'multiple';
  values?: string[];
  disabled?: boolean;
  onToggle?: (value: string) => void;
};

export const [SelectableGroupProvider, useSelectableGroup] =
  createContext<SelectableGroupContextValue>({});
