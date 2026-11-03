import { LayoutFooter } from '@app/components/LayoutFooter';
import { LayoutHeader } from '@app/components/LayoutHeader';
import { layouts, PageLayout } from '@app/components/PageLayout';
import React from 'react';

/** The public site: the landing page, sign in and sign up, in the theme's marketing layout. */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      layout={layouts.marketing}
      kind="marketing"
      header={<LayoutHeader />}
      footer={<LayoutFooter />}
    >
      {children}
    </PageLayout>
  );
}
