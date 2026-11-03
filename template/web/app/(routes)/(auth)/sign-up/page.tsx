'use client';

import { NextLink } from '@app/components/NextLink';
import { HOME_ROUTE, ROLES, signUp, useCurrentUser } from '@app/entities/auth';
import { Button } from '@packages/ui/Button';
import { Controller, Form } from '@packages/ui/Form';
import { Input } from '@packages/ui/Input';
import { Radio, RadioGroup } from '@packages/ui/Radio';
import { Paragraph } from '@packages/ui/Typography';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

type SignUp = { email: string; role: string };

const EMAIL = /^\S+@\S+\.\S+$/;

/**
 * Sign up with an email, and a role when the app has several: there is no
 * backend yet, so any email works. A member already signed in goes on.
 */
export default function SignUpPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const asksRole = ROLES.length > 1;
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUp>({
    defaultValues: { email: '', role: asksRole ? '' : (ROLES[0]?.id ?? '') },
  });

  useEffect(() => {
    if (user) router.replace(HOME_ROUTE);
  }, [user, router]);

  const submit = async ({ email, role }: SignUp) => {
    try {
      await signUp(email, role || undefined);
    } catch {
      setError('root', { message: 'Could not sign you up. Try again.' });
    }
  };

  return (
    <>
      {/* The page's name for assistive tech; the box shows the logo instead of a title. */}
      <h1 className="sr-only">Sign up</h1>
      <Form
        onSubmit={handleSubmit(submit)}
        error={errors.root?.message}
        actions={
          <>
            {/* Takes the row's start, so the button stays at its end. */}
            <Paragraph className="flex-1">
              Already have an account? <NextLink href="/sign-in">Sign in</NextLink>
            </Paragraph>
            <Button
              type="submit"
              loadingWithReason={isSubmitting ? 'Signing you up' : undefined}
            >
              Sign up
            </Button>
          </>
        }
      >
        <Controller
          name="email"
          control={control}
          rules={{
            required: 'Enter your email',
            pattern: { value: EMAIL, message: 'Enter an email like name@example.com' },
          }}
        >
          {({ field }) => (
            <Input label="Email" type="email" autoComplete="email" {...field} />
          )}
        </Controller>
        {asksRole && (
          <Controller
            name="role"
            control={control}
            rules={{ required: 'Choose how you use the app' }}
          >
            {({ field }) => (
              <RadioGroup label="I am" {...field} className="flex-col-gap-2">
                {ROLES.map((role) => (
                  <Radio key={role.id} value={role.id}>
                    {role.name}
                  </Radio>
                ))}
              </RadioGroup>
            )}
          </Controller>
        )}
      </Form>
    </>
  );
}
