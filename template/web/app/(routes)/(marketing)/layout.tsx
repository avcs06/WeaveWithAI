import { MarketingFooter } from '@app/components/MarketingFooter';
import { MarketingHeader } from '@app/components/MarketingHeader';
import { MarketingHeaderLeftSlot } from '@app/components/MarketingHeaderLeftSlot';
import { MarketingHeaderRightSlot } from '@app/components/MarketingHeaderRightSlot';
import { layouts, PageLayout } from '@app/components/PageLayout';
import React from 'react';

/** The public site: the landing page and every page a visitor opens, in the theme's marketing layout. Sign in and sign up have their own. */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      layout={layouts.marketing}
      kind="marketing"
      headerLeft={<MarketingHeaderLeftSlot />}
      header={<MarketingHeader />}
      headerRight={<MarketingHeaderRightSlot />}
      footer={<MarketingFooter />}
    >
      {children}
    </PageLayout>
  );
}
