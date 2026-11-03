import { layouts, PageLayout } from '@app/components/PageLayout';
import { PageLogo } from '@app/components/PageLogo';
import React from 'react';

import { box } from './layout.css';

// The marketing layout's page, with no bar around it: signing in and up stand alone.
const layout = {
  ...layouts.marketing,
  header: { ...layouts.marketing.header, needed: false },
  footer: { ...layouts.marketing.footer, needed: false },
};

/** Sign in and sign up: one centered box with the logo, then the page's form and its buttons. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout layout={layout} kind="marketing">
      <div className={`flex-col-gap-6 ${box}`}>
        <PageLogo />
        {children}
      </div>
    </PageLayout>
  );
}
