import type { InputHTMLAttributes } from 'react';

// Its own `width` replaces the input attribute of that name, as the template's fields do.
export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'width'> & {
  label: string;
  /** Its width as a multiple of the form's field width. */
  width?: '0.5x' | '1x' | '2x';
};

/** A labelled text field. */
export function TextField({ label, width, ...props }: TextFieldProps) {
  return (
    <label data-width={width}>
      {label}
      <input {...props} />
    </label>
  );
}
