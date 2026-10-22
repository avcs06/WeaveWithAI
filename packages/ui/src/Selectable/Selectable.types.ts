import type { HTMLAttributes, ReactElement } from 'react';

export type SelectableVariant = 'outline' | 'filled';

export type SelectableProps = {
  value?: string;
  active?: boolean;
  defaultActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  disabled?: boolean;
  children: ReactElement;
};

type SelectableGroupRootProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange' | 'dir'
> & {
  disabled?: boolean;
};

export type SelectableGroupProps = SelectableGroupRootProps &
  (
    | {
        mode?: 'single';
        value?: string;
        defaultValue?: string;
        onChange?: (value: string) => void;
      }
    | {
        mode: 'multiple';
        value?: string[];
        defaultValue?: string[];
        onChange?: (value: string[]) => void;
      }
  );

export type SelectableGroupContextValue = {
  mode?: 'single' | 'multiple';
  values?: string[];
  disabled?: boolean;
  onToggle?: (value: string) => void;
};
