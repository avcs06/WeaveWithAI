'use client';

import { NextLink } from '@app/components/NextLink';
import { PageHeader } from '@app/components/PageHeader';
import { HOME_ROUTE, signIn, useCurrentUser } from '@app/entities/auth';
import { Button } from '@packages/ui/Button';
import { Controller, Form } from '@packages/ui/Form';
import { Input } from '@packages/ui/Input';
import { Paragraph } from '@packages/ui/Typography';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

type SignIn = { email: string };

const EMAIL = /^\S+@\S+\.\S+$/;

/** Sign in with an email: there is no backend yet, so any email works. A member already signed in goes on. */
export default function SignInPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignIn>({ defaultValues: { email: '' } });

  useEffect(() => {
    if (user) router.replace(HOME_ROUTE);
  }, [user, router]);

  const submit = async ({ email }: SignIn) => {
    try {
      await signIn(email);
    } catch {
      setError('root', { message: 'Could not sign you in. Try again.' });
    }
  };

  return (
    <>
      <PageHeader title="Sign in" description="Welcome back." />
      <Form
        onSubmit={handleSubmit(submit)}
        error={errors.root?.message}
        actions={
          <Button
            type="submit"
            loadingWithReason={isSubmitting ? 'Signing you in' : undefined}
          >
            Sign in
          </Button>
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
      </Form>
      <Paragraph>
        No account yet? <NextLink href="/sign-up">Sign up</NextLink>
      </Paragraph>
    </>
  );
}
