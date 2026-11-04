import type { SelectControlProps, SelectOptionData } from './Select.types';

type SelectionProps = Pick<
  SelectControlProps,
  'multiple' | 'value' | 'onChange'
>;

export type SelectionControl = ReturnType<typeof useSelectionControl>;

export const useSelectionControl = (
  { multiple, value: values, onChange }: SelectionProps,
  getOptionData: (value: string) => SelectOptionData,
  // Removing and clearing happen outside the menu, where no option shows it.
  announce: (message: string) => void,
) => {
  const setValues = (next: string[]) => onChange(next, next.map(getOptionData));

  const isSelected = (value: string) => values.includes(value);
  const without = (value: string) =>
    values.filter((selected) => selected !== value);

  const toggleValue = (value: string) =>
    setValues(isSelected(value) ? without(value) : [...values, value]);

  const removeValue = (value: string) => {
    setValues(without(value));
    announce(`Removed ${getOptionData(value).label}`);
  };

  const clearValues = () => {
    setValues([]);
    announce('Selection cleared');
  };

  return {
    values,
    multiple,
    isSelected,
    setValues,
    removeValue,
    toggleValue,
    clearValues,
  };
};
