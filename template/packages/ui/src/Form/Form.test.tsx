import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ComponentProps, useId } from 'react';
import { useForm } from 'react-hook-form';

import { axe, renderUI } from '../test-utils';

import { Controller, useCanSubmitForm, useController } from '.';

// Takes the whole field, as the design system's text controls do.
type FieldProps = ComponentProps<'input'> & {
  label: string;
  required?: boolean;
  error?: string | true;
};

const Field = ({ label, required, error, ...props }: FieldProps) => {
  const errorId = useId();
  return (
    <div>
      <label>
        {label}
        <input
          {...props}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
      </label>
      {error && <span id={errorId}>{error}</span>}
    </div>
  );
};

type Values = { email: string };

const SignUpForm = ({ onSubmit }: { onSubmit: (values: Values) => void }) => {
  const { control, handleSubmit } = useForm<Values>({
    mode: 'onChange',
    defaultValues: { email: '' },
  });
  const canSubmit = useCanSubmitForm(control);

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{
          required: 'Email is required',
          validate: (value) => value.includes('@') || 'Enter a valid email',
        }}
      >
        {({ field }) => <Field label="Email" {...field} />}
      </Controller>
      <button type="submit" disabled={!canSubmit}>
        Sign up
      </button>
    </form>
  );
};

const email = () => screen.getByRole('textbox', { name: 'Email' });
const submit = () => screen.getByRole('button', { name: 'Sign up' });

describe('Controller', () => {
  it('connects the field: typing updates the form value', async () => {
    const onSubmit = jest.fn();
    const { container } = renderUI(<SignUpForm onSubmit={onSubmit} />);
    expect(email()).toHaveAttribute('name', 'email');
    await userEvent.type(email(), 'ada@example.com');
    await userEvent.click(submit());
    expect(onSubmit).toHaveBeenCalledWith(
      { email: 'ada@example.com' },
      expect.anything(),
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('marks the field required from its rule', () => {
    const RequiredForm = () => {
      const { control } = useForm({
        defaultValues: { a: '', b: '', c: '', d: '', e: '', f: '' },
      });
      const fields = [
        { name: 'a', rules: { required: 'A is required' } },
        { name: 'b', rules: { required: true } },
        { name: 'c', rules: { required: { value: true, message: 'C' } } },
        { name: 'd', rules: { required: { value: false, message: 'D' } } },
        // An empty message enforces nothing in react-hook-form.
        { name: 'e', rules: { required: '' } },
        { name: 'f', rules: {} },
      ] as const;
      return fields.map(({ name, rules }) => (
        <Controller key={name} name={name} control={control} rules={rules}>
          {({ field }) => <Field label={name} {...field} />}
        </Controller>
      ));
    };
    renderUI(<RequiredForm />);
    const field = (name: string) => screen.getByRole('textbox', { name });
    expect(field('a')).toBeRequired();
    expect(field('b')).toBeRequired();
    expect(field('c')).toBeRequired();
    expect(field('d')).not.toBeRequired();
    expect(field('e')).not.toBeRequired();
    expect(field('f')).not.toBeRequired();
  });

  it("passes the current error's message, and clears it once fixed", async () => {
    const { container } = renderUI(<SignUpForm onSubmit={jest.fn()} />);
    await userEvent.type(email(), 'ada');
    expect(email()).toHaveAccessibleDescription('Enter a valid email');
    expect(email()).toBeInvalid();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.type(email(), '@example.com');
    expect(email()).not.toHaveAccessibleDescription();
    expect(email()).toBeValid();
  });

  it('shows required errors on submit from a pristine form', async () => {
    const onSubmit = jest.fn();
    renderUI(<SignUpForm onSubmit={onSubmit} />);
    await userEvent.click(submit());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(email()).toHaveAccessibleDescription('Email is required');
    expect(submit()).toBeDisabled();
  });
});

describe('useController', () => {
  const useNameField = () => {
    const form = useForm({ defaultValues: { name: '' } });
    const controller = useController({
      name: 'name',
      control: form.control,
      rules: { required: 'Name is required' },
    });
    return { form, ...controller };
  };

  it('keeps the field identity while nothing in it changes', () => {
    const { result, rerender } = renderHook(useNameField);
    const field = result.current.field;
    rerender();
    expect(result.current.field).toBe(field);
  });

  it('gives a new field when the error changes', () => {
    const { result } = renderHook(useNameField);
    const field = result.current.field;
    act(() => result.current.form.setError('name', { message: 'Taken' }));
    expect(result.current.field).not.toBe(field);
    expect(result.current.field.error).toBe('Taken');
    expect(result.current.field.required).toBe(true);
  });

  it('passes fieldState and formState through', () => {
    const { result } = renderHook(useNameField);
    act(() => result.current.form.setError('name', { message: 'Taken' }));
    expect(result.current.fieldState.invalid).toBe(true);
    expect(result.current.fieldState.error?.message).toBe('Taken');
    expect(result.current.formState.errors.name?.message).toBe('Taken');
  });
});

describe('useCanSubmitForm', () => {
  it('is true while pristine, false while an error shows', async () => {
    renderUI(<SignUpForm onSubmit={jest.fn()} />);
    expect(submit()).toBeEnabled();
    await userEvent.type(email(), 'ada');
    expect(submit()).toBeDisabled();
    await userEvent.type(email(), '@example.com');
    expect(submit()).toBeEnabled();
  });

  it('follows errors set and cleared outside the fields', () => {
    const { result } = renderHook(() => {
      const form = useForm({ defaultValues: { name: '' } });
      return { form, canSubmit: useCanSubmitForm(form.control) };
    });
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.form.setError('name', { message: 'Taken' }));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.form.clearErrors('name'));
    expect(result.current.canSubmit).toBe(true);
  });
});
