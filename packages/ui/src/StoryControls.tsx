// Stand-ins for stories until the design system has these components; swap
// each for the real one when it lands.
import { classNames } from '@packages/styles/classNames';
import React, { type ComponentProps } from 'react';

import { border, borderColor, controlRadius } from './StoryStyles.css';

type StoryChoiceProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// Spreads its props, so a wrapping Tooltip's handlers and ref reach the button.
export const StoryButton = ({
  className,
  ...props
}: ComponentProps<'button'>) => (
  <button
    type="button"
    {...props}
    className={classNames(
      border,
      borderColor,
      controlRadius,
      'px-3 py-1.5',
      className,
    )}
  />
);

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
