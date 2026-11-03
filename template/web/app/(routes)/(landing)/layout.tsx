import { PageHeader } from '@app/components/PageHeader';
import { layouts, PageLayout } from '@app/components/PageLayout';
import React from 'react';

/** The public site: the landing page, sign in and sign up, in the theme's marketing layout. */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout layout={layouts.marketing} header={<PageHeader />}>
      {children}
    </PageLayout>
  );
}
