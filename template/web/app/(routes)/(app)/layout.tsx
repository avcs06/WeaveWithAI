import { LayoutFooter } from '@app/components/LayoutFooter';
import { LayoutHeader } from '@app/components/LayoutHeader';
import { LayoutSidebar } from '@app/components/LayoutSidebar';
import { layouts, PageLayout } from '@app/components/PageLayout';
import React from 'react';

/** The app a signed-in user works in, in the theme's app layout. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout
      layout={layouts.app}
      scrollMain
      header={<LayoutHeader />}
      sidebar={<LayoutSidebar />}
      footer={<LayoutFooter />}
    >
      {children}
    </PageLayout>
  );
}
