'use client';

import React from 'react';

import { controlAttributes, FormControl } from '../FormControl';
import { useFieldText } from '../utils';

import type { BareInputProps, InputBaseProps, InputProps } from './Input.types';

/**
 * Input's bare text field, with no label, box or message, for a control that
 * draws its own field around it, like Select's search. With `delay`, the text
 * shows at once and `onChange` waits for a pause in typing.
 *
 * @internal
 */
export const BareInput = <D extends number = never>({
  value,
  onChange,
  delay,
  onBlur,
  onKeyDown,
  ...props
}: BareInputProps<D>) => {
  const { text, setText, flush } = useFieldText(value, onChange, delay);

  return (
    <input
      {...props}
      value={text}
      onChange={(event) => setText(event.target.value)}
      // Flush first so the caller's handler, a focus-moving click or Enter's
      // submit sees it.
      onBlur={(event) => {
        flush();
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') flush();
        onKeyDown?.(event);
      }}
    />
  );
};

/** The text field the Input components share; `className` goes on its root. */
export const InputBase = <D extends number = never>({
  value,
  onChange,
  delay,
  className,
  ...props
}: InputBaseProps<D>) => {
  const attributes = controlAttributes(props);

  return (
    <FormControl {...props} className={className}>
      {({ isDisabled, ...controlProps }) => (
        <BareInput
          {...attributes}
          {...controlProps}
          value={value}
          onChange={onChange}
          delay={delay}
          // Native `disabled` would block the box's tooltip; read-only instead.
          readOnly={isDisabled}
          className="flex-fill-x"
        />
      )}
    </FormControl>
  );
};

/**
 * A single-line text field: names, emails, phones, links, titles. In a form,
 * wire it through `Controller`; `delay` saves as the user types.
 *
 * @invalidAlternative input:not([type]), input[type="text"], input[type="email"], input[type="tel"], input[type="url"]
 * @invalidAlternative [role="textbox"]:not([aria-multiline])
 */
export const Input = <D extends number = never>(props: InputProps<D>) => (
  <InputBase {...props} />
);
