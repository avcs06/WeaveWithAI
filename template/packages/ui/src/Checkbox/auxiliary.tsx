'use client';

import React from 'react';

import { SelectableGroup } from '../Selectable';

import type { CheckboxGroupProps } from './Checkbox.types';

/**
 * Checkboxes answering one question, with label, help text and error. Its value
 * is the checked boxes' values. No layout: lay out with `className`, which
 * every use sets.
 *
 * @invalidAlternative SelectableGroup[mode="multiple"]
 * @requiredProp className
 */
export const CheckboxGroup = (props: CheckboxGroupProps) => (
  <SelectableGroup {...props} mode="multiple" />
);
