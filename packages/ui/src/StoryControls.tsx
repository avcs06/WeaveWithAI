// Stand-ins for stories until the design system has these components; swap
// each for the real one when it lands.
import React from 'react';

type StoryChoiceProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const StoryCheckbox = ({
  label,
  checked,
  onChange,
}: StoryChoiceProps) => (
  <label className="inline-flex-row-gap-2 items-center">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);

export const StorySwitch = ({ label, checked, onChange }: StoryChoiceProps) => (
  <label className="inline-flex-row-gap-2 items-center">
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    {label}
  </label>
);
