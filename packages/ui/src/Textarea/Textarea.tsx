'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { controlAttributes, FormControl } from '../FormControl';
import { useFieldText } from '../utils';

import { textarea } from './Textarea.css';

import type { TextareaProps } from './Textarea.types';

/**
 * A multi-line text field: a description, a note, a message. Shows 3 lines by
 * default; the user can drag it taller. In a form, wire it through
 * `Controller`; `delay` saves as the user types. One line of text is an Input.
 *
 * @invalidAlternative textarea, [role="textbox"][aria-multiline="true"]
 */
export const Textarea = <D extends number = never>({
  value,
  onChange,
  delay,
  rows = 3,
  onBlur,
  className,
  ...props
}: TextareaProps<D>) => {
  const { text, setText, flush } = useFieldText(value, onChange, delay);
  const attributes = controlAttributes(props);

  return (
    <FormControl {...props} className={className}>
      {({ isDisabled, ...controlProps }) => (
        <textarea
          {...attributes}
          {...controlProps}
          rows={rows}
          value={text}
          // Native `disabled` would block the box's tooltip; read-only instead.
          readOnly={isDisabled}
          onChange={(event) => {
            if (!isDisabled) setText(event.target.value);
          }}
          // Flush first so the caller's handler or a focus-moving click sees
          // it.
          onBlur={(event) => {
            flush();
            onBlur?.(event);
          }}
          className={classNames(textarea, 'flex-fill-x')}
        />
      )}
    </FormControl>
  );
};
