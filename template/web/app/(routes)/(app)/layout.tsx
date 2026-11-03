'use client';

import { AppFooter } from '@app/components/AppFooter';
import { AppHeader } from '@app/components/AppHeader';
import { AppSidebar } from '@app/components/AppSidebar';
import { AppSidebarFooter } from '@app/components/AppSidebarFooter';
import { AppSidebarHeader } from '@app/components/AppSidebarHeader';
import { layouts, PageLayout } from '@app/components/PageLayout';
import { useCurrentUser } from '@app/entities/auth';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

/** The app a signed-in user works in, in the theme's app layout. A visitor who is not signed in goes to the landing page. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) router.replace('/');
  }, [user, router]);

  // Undefined until the saved session is read.
  if (!user) return null;

  return (
    <PageLayout
      layout={layouts.app}
      kind="app"
      header={<AppHeader />}
      sidebarHeader={<AppSidebarHeader />}
      sidebar={<AppSidebar />}
      sidebarFooter={<AppSidebarFooter />}
      footer={<AppFooter />}
    >
      {children}
    </PageLayout>
  );
}
