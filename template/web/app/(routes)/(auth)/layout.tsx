import {
  layouts,
  PageLayout,
  type PageLayoutConfig,
} from '@app/components/PageLayout';
import { PageLogo } from '@app/components/PageLogo';
import React from 'react';

import { box } from './layout.css';

// The marketing layout's page, with no bar around it: signing in and up stand alone.
// The page centers its box itself, so the main region adds no padding or panel.
const layout: PageLayoutConfig = {
  ...layouts.marketing,
  header: { ...layouts.marketing.header, needed: false },
  footer: { ...layouts.marketing.footer, needed: false },
  main: {
    ...layouts.marketing.main,
    container: 'fluid',
    padding: '0',
    separation: 'none',
  },
};

/** Sign in and sign up: one box in the middle of the screen, with the logo, then the page's form and its buttons. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout layout={layout} kind="marketing">
      <div className="grid min-h-dvh place-items-center p-6">
        <div className={`flex-col-gap-6 ${box}`}>
          <PageLogo />
          {children}
        </div>
      </div>
    </PageLayout>
  );
}
