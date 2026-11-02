'use client';

import { classNames } from '@packages/styles/classNames';
import React from 'react';

import { ControlMessage } from '../FormControl';
import { Section } from '../Section';
import { hasContent } from '../utils';

import { form as formStyle } from './Form.css';

import type { FormProps, FormRowProps } from './Form.types';

/**
 * A form's layout: its fields in a column, then its own `error` and its
 * `actions`, the main one last. Every field is 1x wide, the form's field
 * width, unless its `width` says otherwise, so the fields of one form line
 * up. With a `title` it is a Section of its own; in a Dialog, `fill` gives
 * every field the dialog's width. The browser's own validation is off: the
 * fields show the messages.
 *
 * @invalidAlternative form
 */
export const Form = ({
  title,
  description,
  headingAs,
  error,
  actions,
  fill = false,
  className,
  children,
  ...props
}: FormProps) => {
  const form = (
    <form
      noValidate
      {...props}
      data-ds=""
      data-fill={fill || undefined}
      className={classNames(formStyle, 'flex-col-gap-4', className)}
    >
      {children}
      {/* Kept on the page while empty, like a field's message, so a new error is announced. */}
      <ControlMessage status={hasContent(error) ? 'error' : undefined} message={error} />
      {hasContent(actions) && (
        <div
          data-slot="actions"
          className="flex-row-gap-2 flex-wrap"
          data-ds=""
        >
          {actions}
        </div>
      )}
    </form>
  );

  return hasContent(title) ? (
    <Section title={title} description={description} headingAs={headingAs}>
      {form}
    </Section>
  ) : (
    form
  );
};

/**
 * Fields side by side on one row of a Form, each at its own width; they wrap
 * when the row is too narrow.
 */
export const FormRow = ({ className, ...props }: FormRowProps) => (
  <div
    {...props}
    data-ds=""
    data-slot="row"
    className={classNames('flex-row-gap-4 flex-wrap items-start', className)}
  />
);
