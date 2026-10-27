'use client';

import React from 'react';

import { SelectableGroup } from '../Selectable';

import type { CheckboxGroupProps } from './Checkbox.types';

/**
 * Several checkboxes answering one question, with its label, help text and
 * error. Its value is the checked boxes' values. It adds no layout: lay the
 * checkboxes out with its `className`.
 *
 * @invalidAlternative SelectableGroup[mode="multiple"]
 */
export const CheckboxGroup = (props: CheckboxGroupProps) => (
  <SelectableGroup {...props} mode="multiple" />
);
