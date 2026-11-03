import { layouts, PageLayout } from '@app/components/PageLayout';
import { PageLogo } from '@app/components/PageLogo';
import React from 'react';

import { column } from './layout.css';

// The marketing layout's page, with no bar around it: signing in and up stand alone.
const layout = {
  ...layouts.marketing,
  header: { ...layouts.marketing.header, needed: false },
  footer: { ...layouts.marketing.footer, needed: false },
};

/** Sign in and sign up: the logo above the form, in a narrow column with no header, sidebar or footer. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout layout={layout} kind="marketing">
      <div className={`flex-col-gap-6 ${column}`}>
        <PageLogo />
        {children}
      </div>
    </PageLayout>
  );
}
