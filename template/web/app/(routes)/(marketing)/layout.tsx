import { MarketingFooter } from '@app/components/MarketingFooter';
import { MarketingHeader } from '@app/components/MarketingHeader';
import { MarketingHeaderLeftSlot } from '@app/components/MarketingHeaderLeftSlot';
import { MarketingHeaderRightSlot } from '@app/components/MarketingHeaderRightSlot';
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
      headerLeft={<MarketingHeaderLeftSlot />}
      header={<MarketingHeader />}
      headerRight={<MarketingHeaderRightSlot />}
      footer={<MarketingFooter />}
    >
      {children}
    </PageLayout>
  );
}
