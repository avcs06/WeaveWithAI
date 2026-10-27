'use client';

import React from 'react';

import { SelectableGroup } from '../Selectable';

import type { RadioGroupProps } from './Radio.types';

/**
 * Radios for one choice from a few that stay visible: a ticket type, a
 * pickup option. It's a form field, with its label, help text and error. It
 * adds no layout: lay the radios out with its `className`.
 *
 * @invalidAlternative [role="radiogroup"]
 * @invalidAlternative import('@radix-ui/react-radio-group')
 */
export const RadioGroup = (props: RadioGroupProps) => (
  <SelectableGroup {...props} mode="single" />
);
